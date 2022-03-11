const API = require('./API');

//	Declare variables
let grid = [...new Array(API.mazeHeight()).keys()].map(y => [...new Array(API.mazeHeight()).keys()].map(x => `?`));
let coords = [ 0, API.mazeHeight() - 1 ];
let crossroads = [];
let dir = 0;
let target = [ Math.floor(API.mazeHeight() / 2), Math.floor(API.mazeHeight() / 2) ];
let start = [ ...coords ];
let center = null;
let update = false;
let prev = null;

function log(text) {
	console.error(text);
}

function moveForward(n = 1) {

	//	Move forward
	API.moveForward();

	//	Select direction
	switch (dir) {

		//	If facing north
		case 0: 
			coords[1] -= n;
			break;

		//	If facing east
		case 3: 
			coords[0] += n
			break;

		//	If facing south
		case 2: 
			coords[1] += n
			break;

		//	If facing west
		case 1: 
			coords[0] -= n
			break;

	}

}

function faceDir(d) {

	//	Calculate offset
	let offset = Math.abs(dir - d);
	let left = dir - d < 0 ? true : false;

	//	Turn offset many times
	for (let i = 0; i < offset; i++) {

		//	Turn
		if (left) API.turnLeft();
		else API.turnRight();

	}

	//	Update dir
	dir = d;

} 

function wallFront() {

	//	If theres a wall in front
	if (API.wallFront()) return true;

	//	Get front cell
	let cell = null;
	switch (dir) {

		case 0:
			cell = grid[coords[1] - 1][coords[0]];
			break;

		case 3:
			cell = grid[coords[1]][coords[0] + 1];
			break;

		case 2:
			cell = grid[coords[1] + 1][coords[0]];
			break;

		case 1:
			cell = grid[coords[1]][coords[0] - 1];
			break;

	}

	//	Check if cell is also a deadend
	return cell[4] == '1';

}

function wallBack() {

	//	Get back cell
	let cell = null;
	switch (dir) {

		case 0:
			cell = grid[coords[1] + 1][coords[0]];
			break;

		case 3:
			cell = grid[coords[1]][coords[0] - 1];
			break;

		case 2:
			cell = grid[coords[1] - 1][coords[0]];
			break;

		case 1:
			cell = grid[coords[1]][coords[0] + 1];
			break;

	}

	//	Check if cell is also a deadend
	return cell[4] == '1';

}

function wallLeft() {

	//	If theres a wall
	if (API.wallLeft()) return true;

	//	Get left cell
	let cell = null;
	switch (dir) {

		case 0:
			cell = grid[coords[1]][coords[0] - 1];
			break;

		case 3:
			cell = grid[coords[1] - 1][coords[0]];
			break;

		case 2:
			cell = grid[coords[1]][coords[0] + 1];
			break;
			
		case 1:
			cell = grid[coords[1] + 1][coords[0]];
			break;

	}

	//	Check if cell is also a deadend
	return cell[4] == '1';

}

function wallRight() {

	//	If theres a wall
	if (API.wallRight()) return true;

	//	Get right cell
	let cell = null;
	switch (dir) {

		case 0:
			cell = grid[coords[1]][coords[0] + 1];
			break;

		case 3:
			cell = grid[coords[1] + 1][coords[0]];
			break;

		case 2:
			cell = grid[coords[1]][coords[0] - 1];
			break;

		case 1:
			cell = grid[coords[1] - 1][coords[0]];
			break;

	}

	//	Check if cell is also a deadend
	return cell[4] == '1';

}

function getNumUndiscovered(c) {

	//	Get cell
	const cell = grid[c[1]][c[0]];

	//	Discover cell
	let count = 0;
	if (cell[0] == '0') count += grid[c[1] - 1] ? (grid[c[1] - 1][c[0]] == '?' ? 1 : 0) : 0;
	if (cell[1] == '0') count += grid[c[1]][c[0] + 1] == '?' ? 1 : 0;
	if (cell[2] == '0') count += grid[c[1] + 1] ? (grid[c[1] + 1][c[0]] == '?' ? 1 : 0) : 0;
	if (cell[3] == '0') count += grid[c[1]][c[0] - 1] == '?' ? 1 : 0;

	//	Return count
	return count;

}

function evaluate(c, i = 0) {

	if (i == 3) return 0;
	
	//	Declare variables
	const cell = grid[c[1]][c[0]];
	let score = 0;
	
	if (!cell) return 0;

	//	Calculate distance to target and add to score
	score += 1 / Math.sqrt(Math.pow(target[0] - c[0], 2) + Math.pow(target[1] - c[1], 2));

	if (cell != '?') {

		//	Evaluate surrounding spaces
		let max = -Infinity;
		let numPaths = cell.match(/0/g).length;
		if (cell[0] == '0') {

			//	Evaluate north cell
			const score = evaluate([ c[0], c[1] - 1 ], i + 1);

			//	Update max if better
			if (score > max) max = score;

		}
		if (cell[1] == '0') {

			//	Evaluate east cell
			const score = evaluate([ c[0] + 1, c[1] ], i + 1);

			//	Update max if better
			if (score > max) max = score;

		}
		if (cell[2] == '0') {

			//	Evaluate south cell
			const score = evaluate([ c[0], c[1] + 1 ], i + 1);

			//	Update max if better
			if (score > max) max = score;

		}
		if (cell[3] == '0') {

			//	Evaluate west cell
			const score = evaluate([ c[0] - 1, c[1] ], i + 1);

			//	Update max if better
			if (score > max) max = score;

		}

		//	Add to score
		score += max / numPaths;

	}

	//	Dont go back to previous cell
	score += prev === cell ? 0 : 1;
	score += cell[5] == '1' ? 0 : 1;

	//	Prioritise crossroads
	score += crossroads.includes(c.join('')) ? 1 : 0;

	//	If center is undiscovered then prioritise going to center
	//	Else if center is discovered then prioritise exploration
	score *= center ? 1 : (cell === '?' ? 2 : 1);

	//	Return score
	return score;

}

function main() {
	log('Running...');
	API.setColor(0, 0, 'G');
	API.setText(0, 0, 'START');

	//	Set starting cell
	grid[coords[1]][coords[0]] = `001001`;
	prev = `001001`;

	//	Move forward
	moveForward();

	//	Main simulator loop
	let test = 0;
	while (true) {

		//	Get current cell
		let cell = grid[coords[1]][coords[0]];
		let numPaths = 0;
		
		//	If this cell is undiscovered
		if (cell === '?' || update) {

			//	Discover cell
			let walls = [ wallFront() ? 1 : 0, wallRight() ? 1 : 0, update ? (wallBack() ? 1 : 0) : 0, wallLeft() ? 1 : 0 ];
			walls = [ ...walls.slice(dir), ...walls.slice(0, dir) ];

			//	Add to grid
			grid[coords[1]][coords[0]] = `${walls.join('')}${walls.join('').match(/0/g).length == 1 ? 1 : 0}`;
			cell = grid[coords[1]][coords[0]];
			API.setColor(coords[0], API.mazeHeight() - coords[1] - 1, 'G');
			API.setText(coords[0], API.mazeHeight() - coords[1] - 1, cell);

			//	If this is the target then switch to start
			if (target.join('') == coords.join('')) {
				log('found!')
				target = start;
			}

			//	Updated
			update = true;

		}
		
		//	Calculate number of possible paths
		numPaths = cell.slice(0, 4).match(/0/g).length;

		//	Get number of undiscovered cells
		let numUndiscovered = getNumUndiscovered(coords);

		//	If there are no more possible paths then make this a deadend
		if (numPaths == 1 || numUndiscovered == 0) {
			cell = `${cell.slice(0, 4)}1${numUndiscovered == 0 ? 1 : 0}`;
			grid[coords[1]][coords[0]] = cell;
			API.setColor(coords[0], API.mazeHeight() - coords[1] - 1, 'R');
			API.setText(coords[0], API.mazeHeight() - coords[1] - 1, cell);

			//	Remove from crossroads if there
			const coordsJoined = coords.join('');
			crossroads.filter(c => c !== coordsJoined);

		}
		else {

			//	Add to list of crossroads
			crossroads.push(coords.join(''));

		}

		//	Evaluate surrounding spaces
		let max = -Infinity;
		let curBest = [];
		if (cell[0] == '0') {

			//	Evaluate north cell
			const score = evaluate([ coords[0], coords[1] - 1 ]);

			//	Update max if better
			if (score > max) {

				max = score;
				curBest = [0];

			}
			else if (score == max) curBest.push(0);

		}
		if (cell[1] == '0') {

			//	Evaluate east cell
			const score = evaluate([ coords[0] + 1, coords[1] ]);

			//	Update max if better
			if (score > max) {

				max = score;
				curBest = [3];

			}
			else if (score == max) curBest.push(3);

		}
		if (cell[2] == '0') {

			//	Evaluate south cell
			const score = evaluate([ coords[0], coords[1] + 1 ]);

			//	Update max if better
			if (score > max) {

				max = score;
				curBest = [2];

			}
			else if (score == max) curBest.push(2);

		}
		if (cell[3] == '0') {

			//	Evaluate west cell
			const score = evaluate([ coords[0] - 1, coords[1] ]);

			//	Update max if better
			if (score > max) {

				max = score;
				curBest = [1];

			}
			else if (score == max) curBest.push(1);

		}

		//	Pick random best move
		curBest = curBest[Math.floor(Math.random() * curBest.length)];

		//	Rotate and move
		faceDir(curBest);
		moveForward();

		//	Set prev cell
		prev = cell;

		test++;

	}
}

main();
