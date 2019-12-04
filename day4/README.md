# Day 4 - Passwords and Counting and Digits, oh my!

The crux of today's solution is the aptly named `getNextAscendingNumber` function which, given an integer `n`, will return the lowest integer `m` such that `m > n` and each digit of `m` is greater than or equal to the last.

## How it works

Given the digits of the output should be ascending, the first thing it does is what I call a "digit smear".

It iterates over the digits of `n`, starting with the first, and if any given digit `i` is greater than the next digit `j`, then we set `j` to `i`, this looks something like this:

```
n = 168630
max = 0;
-==================-
168630
^
max = 1;
-==================-
168630
 ^
max = 6;
-==================-
168630
  ^
max = 8;
-==================-
168830
   ^
max = 8;
-==================-
168880
    ^
max = 8;
-==================-
168888
     ^
max = 8;
-==================-

return 168888;
```

Now, if this value is not equal to `n`, we can return it, as this is reliably the lowest valid `m` value.

If this value *is* equal to `n` however, we need to increment a digit.  
So we start at the end of `n` and work our way backwards, until we find one that is less than `max`.

In this case:

```
168888
 ^

return getNextAscendingNumber(170000);
```

As you can see here, we increment the first digit we find greater than `max`, zero out the other numbers, then use a little recursion.  
For the record, `getNextAscendingNumber(170000)` would return `177777`.

### The next step

Once we have our `m` value, we need to check the other criteria: consecutive digits.

For part 1, we only care that there are *at least* 2 digits consecutively. This can easily be checked by regex: `/(\d)\1/`

For part 2 however, we care that there are *exactly* 2 digits consecutively.

Examples given by AoC are:  
`112233` is **valid**, digits ascend, and there are exactly 2 of at least one digit consecutively.  
`123444` is **invalid**, digits ascend, but there are not exactly 2 of a digit consecutively.  
`111122` is **valid**, digits ascend, and while there are too many `1`'s consecutively, there are exactly 2 `2`s.

My approach to check this was as follows:

```py
count = 0
currentDigit = -1

For each digit d in n:
    if d !== currentDigit:
        if count === 2:
            # There are exactly 2 of currentDigit consecutively
            return true
        currentDigit = d
        count = 1

return count === 2
```

Basically iterate through the digits, keeping a count of how many consecutive digits we've seen.  
Whenever we find a new digit, we check if the counter is at 2, and return true if so. Otherwise we reset the counter.  
When the loop ends, we simply return whether the counter is at 2.
