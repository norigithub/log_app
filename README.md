# log_app
Tools for log analysis.

## Requirement
* GeoLite2 Free Geolocation Data(https://dev.maxmind.com/geoip/geoip2/geolite2/).
* Python 3.8 or later.

## Installation
    pip install PACKAGE_NAME.wheel
    
## Sample Script
    from log_app.log_app import AddressStat, run_lookup_api

    astat = AddressStat(log_dir='sample_log')
    astat.import_log()
    astat.exec()
    run_lookup_api(host='127.0.0.1')
    # astat.serve(directory='log_app/template', host='127.0.0.1')
    astat.serve(directory='html', host='127.0.0.1')
