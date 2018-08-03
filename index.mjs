//import {JSDOM} from 'jsdom';
import _jsdom from 'jsdom';
const JSDOM = _jsdom.JSDOM;
import sqlite from 'sqlite';
import _path from 'path';
const pathjoin = _path.join;
const dirname = _path.dirname;

const scheme = "http://"
const host = "";
const printer_status_path = "/PRESENTATION/ADVANCED/INFO_PRTINFO/TOP";
const maint_info_path = "/PRESENTATION/ADVANCED/INFO_MENTINFO/TOP";

const dbfile = process.argv[2] || "log.sqlite";

async function main() {
    try {
        console.log(new Date());
        const { inklevel } = await readPrinterStatus();
        console.log(inklevel);
        const { pagehist, pagesByFunction } = await readPrinterMaintInfo();
        console.log(pagehist);
        console.log(pagesByFunction);
        logToDB(new Date(), inklevel, pagehist, pagesByFunction);
        console.log();
    } catch (error) {
        throw error;
    }
}
main().catch(error => console.error(error));

async function readPrinterStatus() {
    const printer_status_url = `${scheme}${host}${printer_status_path}`;
    const printer_status_dom = await JSDOM.fromURL(printer_status_url);
    const printer_status_doc = printer_status_dom.window.document;
    const printer_tanks = printer_status_doc.querySelectorAll("li.tank");
    const tankinfo = [...printer_tanks].map(node => {
        const label = node.querySelector("div+div");
        const name = label.classList.contains("clrname") ? label.textContent : 'mb';
        const height = node.querySelector("img.color").height | 0;
        const inkst_node = node.querySelector("img.inkst");
        const inkStatus = (() => {
            if (inkst_node) {
                if (inkst_node.src) {
                    if (inkst_node.src.endsWith) {
                        if (inkst_node.src.endsWith("Icn_low.PNG")) {
                            return "low";
                        }
                        else {
                            return inkst_node.src;
                        }
                    }
                }
                return "unknown";
            }
            else {
                return null;
            }
        })(); // other ink statuses
        return { name, height, inkStatus };
    });
    const inklevel = {
        BK: tankinfo.find(tank => tank.name == "BK").height,
        C: tankinfo.find(tank => tank.name == "C").height,
        M: tankinfo.find(tank => tank.name == "M").height,
        Y: tankinfo.find(tank => tank.name == "Y").height,
        mb: tankinfo.find(tank => tank.name == "mb").height
    }
    return { tankinfo, inklevel };
}

async function readPrinterMaintInfo() {
    const printer_maint_url = `${scheme}${host}${maint_info_path}`;
    const printer_maint_dom = await JSDOM.fromURL(printer_maint_url);
    const printer_maint_doc = printer_maint_dom.window.document;

    const groups = printer_maint_doc.querySelectorAll("fieldset.group");

    const pagesBySizeGroup = groups[1];
    const pagesBySizeRows = pagesBySizeGroup.querySelectorAll("table>tbody>tr");
    const pagesBySize = [...pagesBySizeRows].map(row => {
        const label = row.children[0].textContent;
        const ssbw = parseInt(row.children[1].textContent, 10);
        const sscolor = parseInt(row.children[2].textContent, 10);
        const dsbw = parseInt(row.children[3].textContent, 10);
        const dscolor = parseInt(row.children[4].textContent, 10);

        return { label, ssbw, sscolor, dsbw, dscolor };
    });

    const pagehist = pagesBySize.reduce((acc, cur) => ({
        ssbw: acc.ssbw + cur.ssbw,
        sscolor: acc.sscolor + cur.sscolor,
        dsbw: acc.dsbw + cur.dsbw,
        dscolor: acc.dscolor + cur.dscolor
    }));

    const pagesByFunctionGroup = groups[2];
    const pagesByFunctionKeys = pagesByFunctionGroup.querySelectorAll("dl>dt");
    const pagesByFunctionValues = pagesByFunctionGroup.querySelectorAll("dl>dt+dd");

    function grabValue(i){
        return {
            bw: parseInt(pagesByFunctionValues[i].textContent, 10),
            color: parseInt(pagesByFunctionValues[i+1].textContent, 10)
        }
    }
    const pagesByFunction = {
        copy: grabValue(0),
        fax: grabValue(2),
        scan: grabValue(4),
        memPrint: grabValue(6),
        print: grabValue(8)
    }

    return { pagesBySize, pagehist, pagesByFunction };
}

/**
 * 
 * @param {Date} date 
 * @param {{BK: number, C:number, M:number, Y:number, mb:number}} inklevel 
 * @param pagehist 
 * @param pagesByFunction 
 */
async function logToDB(date, inklevel, pagehist, pagesByFunction){
    const migrationsPath = pathjoin(dirname(process.argv[1]), "migrations");
    const db = await sqlite.open(dbfile);
    await db.migrate({migrationsPath});

    const sql = `
        Insert Into "printer_log"
        ("date",     "BK",
        "C",
        "M",
        "Y",
        "mb",
        "ssbw",
        "sscolor",
        "dsbw",
        "dscolor",
        "copy_bw",
        "copy_color",
        "fax_bw",
        "fax_color",
        "scan_bw",
        "scan_color",
        "memPrint_bw",
        "memPrint_color",
        "print_bw",
        "print_color")
        Values (:date,     
            :BK,
            :C,
            :M,
            :Y,
            :mb,
            :ssbw,
            :sscolor,
            :dsbw,
            :dscolor,
            :copy_bw,
            :copy_color,
            :fax_bw,
            :fax_color,
            :scan_bw,
            :scan_color,
            :memPrint_bw,
            :memPrint_color,
            :print_bw,
            :print_color)
    `;
    let obj = {
        ":date": date.toISOString()
    };
    for (const key in inklevel){
        obj[`:${key}`] = inklevel[key];
    }
    for (const key in pagehist){
        obj[`:${key}`] = pagehist[key];
    }
    for (const func in pagesByFunction){
        for (const colorOrBW in pagesByFunction[func]){
            obj[`:${func}_${colorOrBW}`] = pagesByFunction[func][colorOrBW];
        }
    }
    // console.log(obj);
    await db.run(sql, obj);
}