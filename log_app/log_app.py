from pathlib import Path
import re
import geoip2.database
from geoip2.errors import AddressNotFoundError
import ipaddress
import json 
import urllib.request
from urllib.error import HTTPError, URLError
import shutil
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pprint import pformat
from log_app import TEMPLATE_DIR

class AddressStat:
    def __init__(self, log_dir='./log', geolitedb='./GeoLite2-City.mmdb', ignored=[]):
        self.log_dir = log_dir
        self.reader = geoip2.database.Reader(geolitedb)
        self.ignored = ignored
        self.log_list = []
        self.result = {}
        self.cache = {'rev': {}, 'whois': {}}
    
    def import_log(self):
        """
        Read log file.
        """
        p = Path(self.log_dir)
        temp_list = [x for x in p.iterdir()]
        for p in temp_list:
            self.log_list.append(p)
        for p in self.log_list:
            print('\r', 'Reading {}'.format(p.name), end='')
            self.result[p.name] = self._grep_address(p)
            with open(p, 'r') as fp:
                lines = fp.read()

    def exec(self, whois=False):
        """
        Analyze IP addrsses. Retrieve country and city info from GeoIP databaseGeoLite2 Database.
        Output result to a file result.json.
        """
        for name, i in self.result.items():
            c = 1
            total = len(i)
            for v in i:
                print('\r {:20} {:8}/{:8}'.format(name, c, total), end='')
                v['country'], v['city'] = self._get_geoip(v['address'])
                v['status'] = self._get_status(v['log'])
                if whois:
                    if v['address'] in self.cache['whois']:
                        v['whois'] = self.cache['whois'][v['address']]
                    else:
                        v['whois'] = pformat(self._get_whois(v['address']))
                        self.cache['whois'][v['address']] = v['whois']
                c += 1
        self.reader.close()
        self._save_cache()
        self._save_result()

    def _grep_address(self, log_file):
        """
        Grep IP address follows space, colon, ], \n.
        """
        result = []
        tmp_result= {}
        with open(log_file, 'r') as fp:
            lines = fp.read()
        for line in lines.splitlines():
            m = re.search(r'(\d+\.\d+\.\d+\.\d+)($|(?=[\ :\]\n]))', line)
            if m:
                address = m.group()
                if address not in tmp_result:
                    tmp_result[address] = []
                tmp_result[address].append(line)
        for k, v in tmp_result.items():
            result.append({'address': k, 'country': None, 'city': None, 'status': None, 'whois': None,
                            'log': '\n'.join(v)})
        return result
    
    def _get_geoip(self, address):
        """Return geoip city(include country, and city)"""
        try:
            v4 = ipaddress.IPv4Address(address)
            resp = self.reader.city(address)
        except AddressNotFoundError:
            if v4.is_private:
                return 'private', None
        except:
            return 'unknown', None
        
        return resp.country.name, resp.city.name


    def _get_whois(self, address):
        """
        Return whois data via rdap.org.
        rfc7480
        https://about.rdap.org/
        """
        req = urllib.request.Request('https://rdap.org/ip/' + address, headers={'Accept': 'application/rdap+json', 'User-Agent': 'Mozilla/5.0'})
        try:
            resp = urllib.request.urlopen(req)
            result = resp.read().decode()
        except HTTPError as e:
            return {'Error': 'HTTPError ' + str(e.code)}
        except URLError as e:
            return {'Error': 'URLError ' + str(e)}
        except Exception as e:
            return {'Error': str(e)}
        return json.loads(result)
    
    def _get_status(self, log):
        if 'Accepted' in log:
            return 'Accepted'

    def _save_cache(self):
        with open('cache.json', 'w') as fp:
            fp.write(json.dumps(self.cache))

    def _save_result(self):
        dst = Path('./html')
        if not dst.exists():
            dst.mkdir()
        for x in TEMPLATE_DIR.iterdir():
            shutil.copy(x, dst)
        with open(dst.joinpath('result.json'), 'w') as fp:
            fp.write(json.dumps(self.result))

    def serve(self, directory='html', host='127.0.0.1', port=8000, server_class=HTTPServer, handler_class=SimpleHTTPRequestHandler):
        os.chdir(directory)
        server_address = (host, port)
        httpd = server_class(server_address, handler_class)
        print()
        print('Starting http server listening on {}'.format(port))
        print('http://127.0.0.1:{}'.format(port))
        httpd.serve_forever()
    
from wsgiref.simple_server import make_server
from urllib.parse import parse_qs
from socket import gethostbyaddr
import threading

def _reverse_lookup(environ, start_response):
    query = parse_qs(environ['QUERY_STRING'])
    try:
        addr = query['addr'][0]
        result = gethostbyaddr(addr)[0]
        status = '200 OK'
    except KeyError as e:
        result = 'Bad Query'
        status = '400 Bad Request'
    except Exception as e:
        result = str(e)
        status = '400 Bad Request'
    headers = [('Content-type', 'text/plain; charset=utf-8'),
                ('Access-Control-Allow-Origin', '*'),
                ('Content-Length', str(len(result)))]
    start_response(status, headers)
    return [(result.encode('utf-8'))]

def serve_rev(host, port):
    """REST API which returns DNS reverse lookup."""
    with make_server(host, port, _reverse_lookup) as httpd:
        print("\nRunning rev lookup api server on port {}...".format(port))
        httpd.serve_forever()

def run_lookup_api(host='127.0.0.1', port=9000):
    daemon = threading.Thread(name='daemon_server',
                              target=serve_rev,
                              daemon=True, args=(host, port))
    daemon.start()