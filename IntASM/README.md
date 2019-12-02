# IntASM - Why?

I enjoyed building the Intcode Machine for day 2.  
I enjoyed it so much so, that I built a compiler that consumes a simple vaguely-nasm language and spits out valid intcode.

## Example

```
.code
    add 0x01 0x02 0x03
    mul someVal 0x03 someOtherVal
    mul 0x00 0x09 0x00
    add 0x00 someOtherVal 0x00
    exit

.data
    someVal 0x1e
    someOtherVal 0x20
```

Output:
```
1,1,2,3,2,17,3,18,2,0,9,0,1,0,18,0,99,30,32
```

## Sections

Every IntASM program consists of a `.code` section followed by a `.data` section.  
The `.data` section must always *follow* the `.code` section.

The `.code` section consists of a series of operations. Currently supported are `add a0 a1 a2`, `mul a0 a1 a2`, and `exit`.  
These operate identically to their respective opcodes in AoC's Intcode.

The `.data` section consists of a series of variable declarations.  
These consist of a label followed by a value.  
Any references to the label in code will, at compile time, be replaced with the address of the variable, which will store the label.
