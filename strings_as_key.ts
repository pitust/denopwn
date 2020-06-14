import { path, info, radare2, ps, fatal, hex, buf, bufbs } from './mod.ts';
let tgd = path('target');
info('buf("\\xff") =   %s', hex(buf('\xff')));
info('bufbs("\\xff") = %s', hex(bufbs('\xff')));
info('Grabbing strings...');
let i = -1;
let strs = await radare2.strings('data', tgd);
for (let str of strs) {
    i++;
    info('Checking [%s/%s]', i, strs.length);
    if (str.includes('\x00')) {
        info('Includes `nul`, skipping...');
        continue;
    }
    let proc = await ps.local(`./${tgd} "${str}"`);
    await proc.readLine();
    if (!(await proc.readLine()).includes('WRONG')) {
        info('Found key: %o', str);
        Deno.exit(0);
    }
}
fatal('Cannot find key');