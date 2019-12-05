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

## Parameter modes

When using numeric literals (in integer or hex format), the default is immediate mode, ie the value is treated as-is.

For example:
```
add 2 3 3
```
Will add the values `2` and `3`, rather than the values *stored* at those positions.  
It will, however, still store the value at *position* 3, as destination parameters must always be position mode (except for jump destinations)

If you would like to instead reference a *position*, use the asterisk symbol:
```
add *2 *3 3
```
Will add the value stored at position `2` to the value stored at position `3`, in this case `3 + 3`

**Note:** Variable references are always position mode.
```
add myVar 3 3
```
Will always add `3` to the value *stored at* myVar. This means that multiple operations that access the same variable will affect eachother. There is currently no support for immediate mode variables.

## Operators
```
add x y d - Store x + y at location d
mul x y d - Store x * y at location d
inp d     - Read from input and store at location d
prnt x    - Print x to STDOUT
jmpnz x d - Jump to d if x is not zero
jmpz x d  - Jump to d if x is zero
le x y d  - Store 1 at location d if x < y, otherwise store 0
eq x y d  - Store 1 at location d if x = y, otherwise store 0
exit      - Terminate
```
