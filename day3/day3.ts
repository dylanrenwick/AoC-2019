import { readFileSync, existsSync, exists } from "fs";

class GridCommand {
    public direction: GridDirection;
    public distance: number;

    public constructor(dir: GridDirection, dist: number) {
        this.direction = dir;
        this.distance = dist;
    }

    public get vec(): Vector2 {
        switch (this.direction) {
            case GridDirection.Left: return new Vector2(-this.distance, 0);
            case GridDirection.Right: return new Vector2(this.distance, 0);
            case GridDirection.Up: return new Vector2(0, -this.distance);
            case GridDirection.Down: return new Vector2(0, this.distance);
        }
    }

    public static fromString(str: string): GridCommand {
        if (!/^[LRUD]\d+$/.test(str)) {
            console.log("Invalid: " + str);
            return undefined;
        }
        let dir: GridDirection = GridDirection.Left;
        switch (str[0]) {
            case 'L': dir = GridDirection.Left; break;
            case 'R': dir = GridDirection.Right; break;
            case 'U': dir = GridDirection.Up; break;
            case 'D': dir = GridDirection.Down; break;
            default: console.log("Unknown: " + str); return undefined;
        }
        let dist = parseInt(str.substr(1));

        return new GridCommand(dir, dist);
    }
}

class Vector2 {
    private static zero: Vector2 = new Vector2(0, 0);
    public static get ZERO(): Vector2 { return Vector2.zero; }

    public x: number;
    public y: number;

    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public add(other: Vector2): Vector2 {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    // Manhattan Distance
    public dist(other: Vector2): number {
        return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
    }
}

enum GridDirection {
    Left, Right, Up, Down
}

/*
  Compare like this:
  +---a--+
  |   |  |
  |   |  |
  b---X--b
  |   |  |
  +---a--+
 */
function linesOverlap(a1: Vector2, a2: Vector2, b1: Vector2, b2: Vector2): { result: Vector2 | boolean, length: number } {
    let aVert: boolean = a1.x === a2.x;
    let bVert: boolean = b1.x === b2.x;

    // lines are parallel
    if (aVert === bVert) return { result: false, length: 0 };

    if (aVert) {
        let xMin = Math.min(b1.x, b2.x);
        let xMax = Math.max(b1.x, b2.x);
        let yMin = Math.min(a1.y, a2.y);
        let yMax = Math.max(a1.y, a2.y);
        let xMatch = a1.x >= xMin && a1.x <= xMax;
        let yMatch = b1.y >= yMin && b1.y <= yMax;
        return (xMatch && yMatch) ? { result: new Vector2(a1.x, b1.y), length: b1.y - yMin + a1.x - xMin } : { result: false, length: 0 };
    }
    if (bVert) {
        let xMin = Math.min(a1.x, a2.x);
        let xMax = Math.max(a1.x, a2.x);
        let yMin = Math.min(b1.y, b2.y);
        let yMax = Math.max(b1.y, b2.y);
        let xMatch = b1.x >= xMin && b1.x <= xMax;
        let yMatch = a1.y >= yMin && a1.y <= yMax;
        return (xMatch && yMatch) ? { result: new Vector2(b1.x, a1.y), length: a1.y - yMin + b1.x - xMin } : { result: false, length: 0 };
    }
}

function getLength(wire: Vector2[]): number {
    let length = 0;
    for (let i = 0; i < wire.length - 1; i++) {
        length += wire[i].dist(wire[i+1]);
    }
    return length;
}

let filePath = process.argv[2];
if (filePath === undefined || !existsSync(filePath)) throw new Error("Invalid file path");

let commands = readFileSync(filePath).toString("utf8")
    .split("\n").map(l => l.split(",").map(s => GridCommand.fromString(s.trim())));

let wire1: Vector2[] = [new Vector2(0, 0)];
let wire2: Vector2[] = [new Vector2(0, 0)];

let intersecs: Vector2[] = [];
let intersectLengths: number[] = [];

for (let command of commands[0]) {
    wire1.push(wire1[wire1.length - 1].add(command.vec));
}

for (let command of commands[1]) {
    let length2 = getLength(wire2);
    wire2.push(wire2[wire2.length - 1].add(command.vec));
    let length = 0;
    for (let i = 0; i < wire1.length - 1; i++) {
        let sect = linesOverlap(wire1[i], wire1[i+1], wire2[wire2.length-1], wire2[wire2.length-2]);
        if (sect.result instanceof Vector2 && !(sect.result.x === 0 && sect.result.y === 0)) {
            intersecs.push(sect.result);
            intersectLengths.push(length2 + length + sect.length)
        }
        length += getLength([wire1[i], wire1[i + 1]]);
    }
}

// part 1, intersection closest to origin
console.log(intersecs);
console.log(Math.min(...intersecs.map(v => v.dist(Vector2.ZERO))));

// part 2, intersection shortest combined length of wire from origin
console.log(intersectLengths);
console.log(Math.min(...intersectLengths));
