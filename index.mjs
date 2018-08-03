//import {JSDOM} from 'jsdom';
import _jsdom from 'jsdom';
const JSDOM = _jsdom.JSDOM;

const scheme = "http://"
const host = "";
const printer_status_path = "/PRESENTATION/ADVANCED/INFO_PRTINFO/TOP";
const maint_info_path = "PRESENTATION/ADVANCED/INFO_MENTINFO/TOP";

async function main() {
    try {
        const { tankinfo } = await readPrinterStatus();

        console.log(tankinfo);
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
    return { tankinfo };
}
