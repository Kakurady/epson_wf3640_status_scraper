WF3640 Status Scraper
=====================
This program querys Epson WF-3640 multi-function printer for its current ink level and page count; then, logs the information to a SQLite database.

How to use
----------
You need node.js 8+ to run this script.

* Copy `config.example.json` to `config.json`, and enter your printer's IP or hostname as the `host` property.
* Run `npm i` to install dependencies.
* Run the script with `node --experimental-modules index.mjs [path_to_sqlite_database.sqlite]`.
  * If you do not specify a path for the database file, it will be saved as `log.sqlite` in the current directory.

Licensing
---------
ISC

See also
--------
* https://github.com/Pix---/ioBroker.epson_stylus_px830
