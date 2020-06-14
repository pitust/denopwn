import { red, blue, bold, yellow } from 'https://deno.land/std/fmt/colors.ts';
export const te = new TextEncoder();
export const td = new TextDecoder();
export type Type = 'u64' | 'u32' | 'u16' | 'u8' | 's64' | 's32' | 's16' | 's8' | number | string;
export type StructDef = Type | { [field: string]: StructDef };
export type DataArray = { buffer: ArrayBuffer } | ArrayBuffer | string;
/**
 * An intager (bigint or number)
 */
export type Int = number | bigint;
type TypeMapper<T, U extends string> = T extends { [x in U]: infer V } ? V : never;
// @ts-ignore
type UnpackMap<T extends StructDef> = T extends Type ? (T extends 'u64' ? bigint : T extends 's64' ? bigint : T extends number ? Uint8Array : number) : { [key in keyof T]: UnpackMap<TypeMapper<T, key>> }
/**
 * A nice formatter optimized with colors and everything.
 * 
 * How to use? Make your format string have %<something> in places you want to place something else.
 * 
 * What is that something?
 * % - just print out %
 * 
 * x - print out hex-encoded int.
 * 
 * p - print out hex-encoded long (bigint).
 * 
 * o - print out an object.
 * 
 * d - print out an int.
 * 
 * l - print out a long.
 * 
 * b - print out a boolean
 * 
 * @param format The format string.
 * @param args Format string values.
 * @returns Formatted string.
 */
export function fmt(format: string, ...args: any[]): string {
    return format.replace(/%(.)/g, (a: string) => {
        let x = a[1];
        if (x == '%') return '%';
        if (x == 'x') return yellow('0x' + int(args.shift()).toString(16).padStart(8, '0'));
        if (x == 'p') return yellow('0x' + long(args.shift()).toString(16).padStart(16, '0'));
        if (x == 'o') return Deno.inspect(args.shift());
        if (x == 's') return `${args.shift()}`;
        if (x == 'l') return yellow(long(args.shift()).toString());
        if (x == 'd') return yellow(int(args.shift()).toString());
        if (x == 'b') return yellow((!!args.shift()).toString());
        if (x == 'n') return 'haha no.'
        return '%' + x;
    })
}
/**
 * Shows an information on the standard output.
 * @param format The format ({@link fmt})
 * @param args Arguments to the format.
 */
export function info(format: string, ...args: any[]) {
    console.log('%s', `${blue(bold('[+] '))}${fmt(format, ...args)}`);
}
/**
 * Shows a warning on the standard error.
 * @param format The format ({@link fmt})
 * @param args Arguments to the format.
 */
export function warn(s: string, ...args: any[]) {
    console.warn('%s', `${yellow(bold('[!] '))}${fmt(s, ...args)}`);
}

/**
 * Shows an error on the standard error.
 * @param format The format ({@link fmt})
 * @param args Arguments to the format.
 */
export function error(s: string, ...args: any[]) {
    console.error('%s', `${red(bold('[!] '))}${fmt(s, ...args)}`);
    console.error('%s', `    at ${oneUserFrame()}`);
}

/**
 * Shows an error on the standard error and exits.
 * @param format The format ({@link fmt})
 * @param args Arguments to the format.
 */
export function fatal(s: string, ...args: any[]): never {
    console.error('%s', `${red(bold('[!] '))}${fmt(s, ...args)}`);
    console.error('%s', `    at ${oneUserFrame()}`);
    Deno.exit(1);
}
/**
 * This function rounds `n` to the nearest `to`. Useful for paging stuff.
 * @param n the number to be rounded.
 * @param to the number n should be rounded to.
 * @returns The result of rounding.
 */
export function roundUp(n: Int, to: Int): bigint {
    let nv = (long(n) / long(to)) * long(to);
    if (nv != long(n)) nv += long(to);
    return nv;
}
/**
 * A function for getting the entire stack trace by file names
 * @returns The stack trace.
 */
export function stacktrace() {
    return ((new Error()).stack!.split('\n').slice(1).map(e => e.split('(').slice(1).join('(').slice(0, -1) || e.split('at ').slice(1).join('at '))).slice(1);
}
/**
 * A function for getting a single stack frame from outside of denopwn.
 * @returns The first stack trace outside of denopwn
 */
export function oneUserFrame(): string {
    let f = stacktrace();
    return f.filter(e => !e.startsWith(f[0].split(':')[0]))[0] || f.slice(-1)[0];
}
/**
 * Do something with a dataview in a smaller form factor.
 * @param sz The size of the dataview needed.
 * @param fn A function that takes our dataview and puts something in it
 * @returns The backing buffer of the dataview.
 */
export function dvop(sz: number, fn: (dv: DataView) => any): Uint8Array {
    let b = new Uint8Array(sz);
    fn(dv(b));
    return buf(b);
}
/**
 * Directly unpack the buffer. {@link struct}
 * @param def The definition of the structure
 * @param nrbin the binary to be unpacked
 * @param obj an object with a single property, ret, which is used for the actual value.
 * @returns The amount of bytes used.
 */
export function unpack<T extends StructDef>(def: T, nrbin: DataArray, obj: { ret: UnpackMap<T> }): number {
    if (typeof def == 'number') {
        obj.ret = <any>buf(nrbin).slice(0, def);
        return def;
    }
    if (typeof def == 'string') {
        let bin = dv(nrbin);
        if (def == 's8') {
            obj.ret = bin.getInt8(0) as any;
            return 1;
        }
        if (def == 'u8') {
            obj.ret = bin.getUint8(0) as any;
            return 1;
        }
        if (def == 's16') {
            obj.ret = bin.getInt16(0, true) as any;
            return 2;
        }
        if (def == 'u16') {
            obj.ret = bin.getUint16(0, true) as any;
            return 2;
        }
        if (def == 's32') {
            obj.ret = bin.getInt32(0, true) as any;
            return 4;
        }
        if (def == 'u32') {
            obj.ret = bin.getUint32(0, true) as any;
            return 4;
        }
        if (def == 's64') {
            obj.ret = bin.getBigInt64(0, true) as any;
            return 8;
        }
        if (def == 'u64') {
            obj.ret = bin.getBigUint64(0, true) as any;
            return 8;
        }
        if (def.startsWith('raw:')) {
            let mwf = td.decode(buf(nrbin).slice(0, def.length - 4));
            if (hex(mwf) != hex(def.slice(4))) fatal('Wrong magic.');
            return def.length - 4;
        }
        fatal('Unknown type %s', def);
    }
    let bin = buf(nrbin);
    let ol = bin.length;
    let r = Object.create(null);
    for (let k of Object.keys(def)) {
        let v = Object.getOwnPropertyDescriptor(def, k)?.value! as StructDef;
        let nro: any = { ret: null };
        let fsz = unpack(v, bin, nro);
        bin = bin.slice(fsz);
        r[k] = nro.ret;
    }
    obj.ret = r;
    return ol - bin.length;
}
/**
 * Directly repack the buffer. {@link struct}
 * @param def The definition of the structure
 * @param output A callback that will be called for every chunk of the output
 * @param raw The unpacked data
 */
export function pack<T extends StructDef>(def: T, output: (data: DataArray) => void, raw: UnpackMap<T>) {
    if (typeof def == 'number') {
        output(unhex('00'.repeat(def)));
    }
    if (typeof def == 'string') {
        if (def.startsWith('raw:')) {
            output(def.slice(4));
        }
        if (def == 's8') output(dvop(1, dv => dv.setInt8(0, raw as number)));
        if (def == 'u8') output(dvop(1, dv => dv.setUint8(0, raw as number)));
        if (def == 's16') output(dvop(2, dv => dv.setInt16(0, raw as number, true)));
        if (def == 'u16') output(dvop(2, dv => dv.setUint16(0, raw as number, true)));
        if (def == 's32') output(dvop(4, dv => dv.setInt32(0, raw as number, true)));
        if (def == 'u32') output(dvop(4, dv => dv.setUint32(0, raw as number, true)));
        if (def == 's64') output(dvop(8, dv => dv.setBigInt64(0, raw as bigint, true)));
        if (def == 'u64') output(dvop(8, dv => dv.setBigUint64(0, raw as bigint, true)));
        return;
    }
    for (let k in def) {
        pack(def[k] as any, output, (raw as any)[k] as any);
    }
}
/**
 * Concatenate blocks
 * @param blocks 
 * @returns The result of concatenation of those blocks
 */
export function cat(blocks: DataArray[]): Uint8Array {
    let sz = 0;
    for (let blk of blocks) sz += buf(blk).length
    let bigbuf = new Uint8Array(sz);
    let i = 0;
    for (let blk of blocks) for (let ent of buf(blk)) bigbuf[i++] = ent;
    return bigbuf;
}
/**
 * Get an offset view to a DataArray (this is **not** a reference)
 * @param data The view to return an offset into 
 * @param start The start of the view.
 * @param len (optional) the amount of bytes to include. If not provided all the bytes will be included
 * @returns The offset view
 */
export function off(data: DataArray, start: Int, len: Int = -1): Uint8Array {
    return buf(data).slice(int(start), len === -1 ? undefined : int(start) + int(len));
}
/**
 * A convenience class for unpacking and packing. {@link struct]
 */
export class Struct<T extends StructDef> {
    #descr: T;
    /**
     * 
     * @param descr The descriptor.
     */
    constructor(descr: T) {
        this.#descr = descr;
    }
    /**
     * Unpack DataArray into an object. Undoes {@link Struct.pack}
     * @param bin The DataArray to be unpacked
     * @returns Unpacked version of `bin`
     */
    unpack(bin: DataArray): UnpackMap<T> {
        let o: any = { ret: null };
        unpack(this.#descr, bin, o);
        return o.ret;
    }
    /**
     * Repacks the object into an Uint8Array. Undoes {@link Struct.unpack}
     * @param o The object to be repacked
     * @returns The result of packing
     */
    pack(o: UnpackMap<T>): Uint8Array {
        let blocks: Uint8Array[] = [];
        let outblk = (d: DataArray) => blocks.push(buf(d));
        pack(this.#descr, outblk, o);
        return cat(blocks);
    }
}
/**
 * Gets the main entrypoint to the program. This does NOT work on windows and is experimental on darwin.
 * 
 * TODO: Make denopwn CLI tool that enables this to work.
 */
export function getMain(): string {
    if ((Deno as any).main) return ((Deno as any).main) as string;
    if (Deno.build.os == 'windows') fatal('Main cannot be extracted on windows or if procfs is not mounted/accessible.');
    if (Deno.build.os == 'darwin') warn('Main extraction is experminatal on darwin.')
    try {
        let a = Deno.readTextFileSync('/proc/self/cmdline').split('\x00');
        if (a[0] != 'deno') {
            // Deno installed
            return Deno.readTextFileSync('/proc/self/exe').split('\n')[2].split(' ').slice(-2)[0].slice(1, -1)
        } else {
            return a.slice(1).find(e => e[0] != '-')!;
        }
    } catch (e) {
        fatal('Main extraction failed (do you have read rights to procfs and deno?)');
    }
}
/**
 * A convenience function to automatically load a structure from a file in the same directory as `main` (must be local) called struct.ts.
 * @example
 * // struct.ts
 * export type ELF64 = {
 *     magic: 'raw:\x7fELF';
 *     ei_class: 'u8';
 *     ei_endian: 'u8';
 *     ei_verson: 'u8';
 *     ei_osabi: 'u8';
 *     ei_abiversion: 'u8';
 *     ei_pad: 7;
 *     e_type: 'u16';
 *     e_machine: 'u16';
 *     e_version: 'u32';
 *     e_entry: 'u64';
 *     e_phoff: 'u64';
 *     e_shoff: 'u64';
 *     e_flags: 'u32';
 *     e_ehsize: 'u16';
 *     e_phentsize: 'u16';
 *     e_phnum: 'u16';
 *     e_shentsize: 'u16';
 *     e_shnum: 'u16';
 *     e_shstrndx: 'u16';
 * }
 * // hack.ts
 * import { struct, info, load, off, int, long } from '../denopwn/mod.ts';
 * let file = load('file');
 * let elf64 = struct<import('./struct.ts').ELF64>('ELF64');
 * let { e_phnum, e_phoff, e_entry } = elf64.unpack(fuzzed);
 * info('Found e_phnum = %d', e_phnum);
 * info('Found e_phoff = %d', e_phoff);
 * info('Found e_entry = %x', e_entry);
 * @param structId The name of the structure
 * @param main (optional) set the main entrypoint.
 */
export function struct<T extends StructDef>(structId: string, main?: string): Struct<T> {
    main = import.meta.url;
    let mainSplit = main.split('/');
    mainSplit[mainSplit.length - 1] = 'struct.ts';
    let mainRejoined = mainSplit.join('/');
    let mainContent = Deno.readTextFileSync(mainRejoined);
    let mainContentSearchKeyword = `export type ${structId} = `;
    let idx = mainContent.indexOf(mainContentSearchKeyword) + mainContentSearchKeyword.length;
    mainContent = mainContent.slice(idx)
    let idx2 = 0, cnt = 0;
    for (; ; idx2++) {
        if (mainContent[idx2] == '{') cnt++;
        if (mainContent[idx2] == '}') cnt--;
        if (cnt == 0) break;
    }
    let data = mainContent.slice(0, idx2 + 1).replace(/;/g, ',');
    return new Struct<T>(eval(`(${data})`));
}
/**
 * Load a file as specified by a CLI flag.
 * @param f The name of the flag.
 * @returns The contents
 */
export function load(f: string): Uint8Array {
    let argIdx = Deno.args.findIndex(e => `--${f}` == e || e.startsWith(`--${f}=`));
    if (argIdx == -1) fatal(`Argument ${f} was not provided.`);
    let argItself = Deno.args[argIdx];
    if (argItself.startsWith(`--${f}=`)) {
        return Deno.readFileSync(argItself.slice(f.length + 3));
    } else {
        let argVal = Deno.args[argIdx + 1];
        if (argVal) {
            return Deno.readFileSync(argVal);
        }
    }
    fatal(`Argument ${f} was not provided.`);
}
/**
 * Gets the path to file as specified by a CLI flag.
 * @param f The name of the flag.
 * @returns The path
 */
export function path(f: string): string {
    let argIdx = Deno.args.findIndex(e => `--${f}` == e || e.startsWith(`--${f}=`));
    if (argIdx == -1) fatal(`Argument ${f} was not provided.`);
    let argItself = Deno.args[argIdx];
    if (argItself.startsWith(`--${f}=`)) {
        return argItself.slice(f.length + 3);
    } else {
        let argVal = Deno.args[argIdx + 1];
        if (argVal) {
            return argVal;
        }
    }
    fatal(`Argument ${f} was not provided.`);
}
/**
 * Convert a DataArray to a Uint8Array
 * @param f The DataArray.
 * @returns The result of the conversion
 */
export function buf(f: DataArray): Uint8Array {
    if (f instanceof ArrayBuffer) return new Uint8Array(f);
    if (typeof f == 'string') return te.encode(f);
    return new Uint8Array(f.buffer);
}
/**
 * Convert a DataArray to a string.
 * @param f The DataArray.
 * @returns The result of the conversion
 */
export function str(f: DataArray): string {
    return td.decode(buf(f));
}
/**
 * Convert a byte string to Uint8Array. THIS DOES NOT DECODE UTF8!!!
 * @param f The DataArray.
 * @returns The result of the conversion
 */
export function bufbs(f: string): Uint8Array {
    return new Uint8Array([...f].map(e => e.charCodeAt(0)));
}
/**
 * Convert a DataArray to a DataView
 * @param f The DataArray.
 * @returns The result of the conversion
 */
export function dv(f: DataArray): DataView {
    let mdv = new DataView(buf(f).buffer);
    return mdv;
}
/**
 * Convert a DataArray to a hex string
 * @param f 
 * @returns The result of the conversion
 */
export function hex(f: DataArray): string {
    return [...buf(f)].map(e => e.toString(16).padStart(2, '0')).join('');
}
/**
 * Convert a hex string to an Uint8Array
 * @param s The hex string
 * @returns The result of the conversion
 */
export function unhex(s: string): Uint8Array {
    return new Uint8Array(s.split(/(..)/).filter(e => e).map(e => parseInt(e, 16)));
}
/**
 * Flips a DataArray
 * @param arr The data array to be flipped
 * @returns The result of the conversion
 */
export function flip(arr: DataArray): Uint8Array {
    return buf(arr).map(e => e).reverse();
}
/**
 * Convert an {@link Int} to number
 * @param s the Int
 * @returns The result of the conversion
 */
export function int(s: number | bigint): number {
    return parseInt(s.toString());
}
/**
 * Convert an {@link Int} to a bigint
 * @param s the Int
 * @returns The result of the conversion
 */
export function long(s: number | bigint): bigint {
    return BigInt(s.toString());
}
/**
 * Generate searchable string
 * @param len The length of a searchable
 */
export function searchable(len: number): string {
    let o = '';
    for (let i = 0; i < len; i += 5) {
        o += 'A' + i.toString(36).padStart(3, '0');
    }

    return o.slice(0, len);
}
/**
 * Find an index in a searchable
 * @param x 
 */
export function searchInSearchable(x: string): number {
    let [left, right] = x.split('A');
    let rcn = parseInt(right + left, 36) + 4 - left.length;;
    return searchable(rcn + 12).indexOf(x);
}
/**
 * Copy in data from `ins` to `b`
 * @param b Where to copy in
 * @param ins What to copy
 * @param offset The offset in b to copy
 */
export function copyIn(b: Uint8Array, ins: DataArray, offset: number): void {
    let x = buf(ins);
    for (let i = 0;i < b.length;i++) b[i + offset] = x[i];
}
/**
 * Prompt the user for data
 * @param str The prompt (optional, defaults to '> ', is made bold-red)
 */
export async function prompt(str: string = '> '): Promise<string> {
    Deno.stdout.write(te.encode(bold(red(str))));
    let o = '';
    while (true) {
        let mybuf = new Uint8Array(1);
        let r = await Deno.stdin.read(mybuf);
        if (r == null) return o;
        o += td.decode(mybuf);
        if (o.includes('\n')) return o.trim();
    }
}
/**
 * Implements a "Process" - a reader and a writer, along with some utility functions.
 */
export class Process {
    #rd: Deno.Reader;
    #wr: Deno.Writer;
    /**
     * Create a new process.
     * @param rd The standard output and error of the process
     * @param wr The standard input of the process
     */
    constructor(rd: Deno.Reader, wr: Deno.Writer) {
        this.#rd = rd;
        this.#wr = wr;
    }
    async readLine(): Promise<string> {
        return str(await this.readUntilPredicate(a => str(a).includes('\n')));
    }
    async readUntil(s: string): Promise<string> {
        return str(await this.readUntilPredicate(a => str(a).includes(s)));
    }
    async readUntilPredicate(pred: (a: Uint8Array) => boolean): Promise<Uint8Array> {
        let rdBuffer: Uint8Array[] = [];
        while (true) {
            let buf = new Uint8Array(1);
            let d = (await this.#rd.read(buf));
            if (d === 1) rdBuffer.push(buf);
            if (d === null) return cat(rdBuffer);
            if (pred(cat(rdBuffer))) {
                return cat(rdBuffer);
            }
        }
    }
    async write(d: DataArray) {
        await this.#wr.write(buf(d));
    }
    async interact() {
        let rd = this.#rd;
        let wr = this.#wr;
        this.#rd = null as unknown as Deno.Reader;
        this.#wr = null as unknown as Deno.Writer;
        await Promise.all([
            Deno.copy(rd, Deno.stdout),
            Deno.copy(Deno.stdin, wr)
        ]);
    }
}
interface RunOptionsNoCmd {
    cwd?: string;
    env?: {
        [key: string]: string;
    };
    stdout?: "inherit" | "piped" | "null" | number;
    stderr?: "inherit" | "piped" | "null" | number;
    stdin?: "inherit" | "piped" | "null" | number;
}
/**
 * Exports utilities for dealing with {@link Process}
 */
export const ps = {
    /**
     * Spawn a local process
     * @param invocation Processes invocation as you would type into bash(1)
     * @param options (optional) Extra options to pass to Deno.run
     * @returns The process
     */
    async local(invocation: string, options: RunOptionsNoCmd = {}): Promise<Process> {
        let dps = Deno.run({ cmd: ['bash', '-c', invocation, '2>&1'], stdout: 'piped', stdin: 'piped', ...options });
        return new Process(dps.stdout!, dps.stdin!);
    },
    /**
     * Connect to a remote host in order to connect to a process
     * @param host The host
     * @param port Port on which the connection should be made
     * @returns The process
     */
    async remote(host: string, port: number): Promise<Process> {
        let rdwr = await Deno.connect({ hostname: host, port });
        return new Process(rdwr, rdwr);
    },/**
     * Listen on a local socket in order to connect to a process
     * @param port The port to bind to
     */
    async listen(port: number): Promise<Process> {
        let sock = await Deno.listen({ hostname: '0.0.0.0', port });
        let rdwr = await sock.accept();
        return new Process(rdwr, rdwr);
    }
}
/**
 * Convenience functions for radare2/rabin2
 */
export const radare2 = {
    /**
     * Asks rabin2 about strings.
     * @param mode How should we get the strings?
     * @param binpath Path to the binary with the strings
     * @returns Strings
     */
    async strings(mode: 'data' | 'raw' | 'even-rawer', binpath: string): Promise<string[]> {
        let mf = mode == 'data' ? '-z' : mode == 'raw' ? '-zz' : '-zzz';
        return str(await (Deno.run({ cmd: ['rabin2', '-qq', mf, binpath], stderr: 'null', stdout: 'piped' })).output()).split('\n').filter(e => e);
    }
}
