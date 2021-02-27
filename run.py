from log_app.log_app import AddressStat, run_lookup_api

astat = AddressStat(log_dir='sample_log')
astat.import_log()
astat.exec()
run_lookup_api(host='127.0.0.1')
# astat.serve(directory='log_app/template', host='127.0.0.1')
astat.serve(directory='html', host='127.0.0.1')