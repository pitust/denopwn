export type ELF64 = {
    magic: 'raw:\x7fELF';
    ei_class: 'u8';
    ei_endian: 'u8';
    ei_verson: 'u8';
    ei_osabi: 'u8';
    ei_abiversion: 'u8';
    ei_pad: 7;
    e_type: 'u16';
    e_machine: 'u16';
    e_version: 'u32';
    e_entry: 'u64';
    e_phoff: 'u64';
    e_shoff: 'u64';
    e_flags: 'u32';
    e_ehsize: 'u16';
    e_phentsize: 'u16';
    e_phnum: 'u16';
    e_shentsize: 'u16';
    e_shnum: 'u16';
    e_shstrndx: 'u16';
}