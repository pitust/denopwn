# DenoPwn
A library for pwning things in deno.
## Getting started
### Dependencies
 - Deno
 - radare2
 - That's it!
### Example
This works only on x86-64 linux.
Grab license_1 from [here](https://github.com/LiveOverflow/liveoverflow_youtube/blob/master/0x05_simple_crackme_intro_assembler). It is a simple license check. Make sure you `chmod +x` it before proceeding.
Now, how to pwn it?
```sh
deno run https://deno-website2-ieysbo3h2.vercel.app/x/pwn/strings_as_key.ts --target path/to/license1
```
You should see see it get compiled and print some log output:
```
[+] Grabbing strings...
[+] Checking [0/6]
[+] Checking [1/6]
[+] Found key: AAAA-Z10N-42-OK
```
Of course, there will be pretty colors if your terminal supports them
```
$ ./license_1 AAAA-Z10N-42-OK
Checking License: AAAA-Z10N-42-OK
Access Granted!
```
## Docs
[link](https://pitust.github.io/denopwn/)
## License
ISC License, see LICENSE.md
## Generating docs
```
typedoc --excludeNotExported --excludeNotDocumented --theme ~/.nvm/versions/node/v13.8.0/lib/node_modules/eledoc/bin/default/ --name DenoPwn ./mod.ts --out docs/  --ignoreCompilerErrors
```