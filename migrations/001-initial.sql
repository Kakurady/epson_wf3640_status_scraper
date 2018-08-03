-- Up
--------
create table "printer_log" (
    "date"  text primary key,
    "BK"      integer,
    "C"     integer,
    "M"     integer,
    "Y"    integer,
    "mb"    integer,
    "ssbw" integer,
    "sscolor" integer,
    "dsbw" integer,
    "dscolor" integer,
    "copy_bw" integer,
    "copy_color" integer,
    "fax_bw" integer,
    "fax_color" integer,
    "scan_bw" integer,
    "scan_color" integer,
    "memPrint_bw" integer,
    "memPrint_color" integer,
    "print_bw" integer,
    "print_color" integer
);
-- Down
--------
drop table "printer_log";