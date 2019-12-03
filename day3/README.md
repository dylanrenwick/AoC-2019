# Day 3 - Wired up

For day 3 I originally created an extendable grid class, with the intention of literally drawing out both wires as I went.

I instead opted to store the endpoint of each segment, plus the starting point of `[0, 0]`.

While calculating the endpoints for the second wire, I also go through each segment of the first wire and check if the new wire2 segment intersects with any wire1 segments. If it does, I store the location of the intersection in an array, and store how much wire I traversed to reach that intersection.

Then at the end I can simply fetch the distance of the closest intersection to origin, and fetch the shortest wire distance.