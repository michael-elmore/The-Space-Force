// AUTHOR:  Michael Elmore
// DATE:    04/05/2018
// ABOUT:   Game: "The Space Force"

// Initialisation parameters
window.onload = init();
var canvas, ctx;
var sizeX = canvas.width;
var sizeY = canvas.height;
var score = 0;
var level = 0;
var paused = false;
var inmenu = true;
var testmode = false;
var music = false;
var gameNum = 0;
var messages = [];
var lgTriggered = false;
var lEnergyRestorationTriggered = false;
var showLEnergyLevel = false;
var invincibility = false;
var controlLock = false;
var maxNumberofParticles = 0;

// Shapes used in this game.
var ship = [[0,-10], [10,10], [0,5], [-10,10]];
var missileShape = [[0, -8], [1, -8], [2, -7], [2, 7], [0, 7], [-2, 7], [-2, -7], [-1, -8]];

// Sounds used in this game.
var soundEngine = new Audio("audio/rocketEngine2.mp3");
var soundThruster = new Audio("audio/thrusterEngine.wav");
var soundMissile = new Audio("audio/rocketEngine2.mp3");
var soundDShot = new Audio("audio/dShot.wav");
var soundLShot = new Audio("audio/lShots.wav");
var soundShotImpact = new Audio("audio/shotImpact.wav");
var soundAsteroidExplosion = new Audio("audio/asteroidExplosion.mp3");
var soundShipExplosion = new Audio("audio/shipExplosion.mp3");
var songTravaUDoma = new Audio ("audio/songTravaUDoma1.mp3");

function createShip()
{
    // Initialises the player.
    var player = {
        type: "player",
        shape: ship,
        pos: [Math.round(sizeX/2), Math.round(sizeY/2)],
        rot: 0,
        vel: [0, 0],
        gradientFill: false,
        color: "Grey",
        size: 10,
        dPower: 1,
        dRate: 0.125,
        lPower: 1,
        lRate: 1,
        numMissiles: 4,
        missileLoaded: true,
        lEnergy: 100,
        lEnergyRecharge: 0.5,
        health: 100,
        ships: 3
    }
    return player;
}

var player = createShip();

var keysDown = {
    w: false,
    a: false,
    d: false,
    space: false,
    f: false,
    r: false
}

function init()
{
    canvas = document.querySelector("#gamecanvas");
    canvas.width = Math.max(1280, Math.min(window.innerWidth, 1600));
    canvas.height = canvas.width * (9/16);
    ctx = canvas.getContext("2d");
    requestAnimationFrame(animate);
    document.addEventListener("keydown", keyPressed);
    document.addEventListener("keyup", keyReleased);
}

// CONTROLS
function keyPressed(event)
{
    /* Logs which keyboard keys are currently pressed.
    Necessary for smooth controls. */
    if (controlLock)
    {
        keysDown.w = false;
        keysDown.a = false;
        keysDown.d = false;
        keysDown.space = false;
        keysDown.f = false;
        keysDown.r = false;
    }
    else
    {
        var keyRef = event.keyCode;
        if (keyRef === 37 || keyRef === 38 || keyRef ===39)
        {
            event.preventDefault();
        }
        if (keyRef === 65 || keyRef === 37)
            keysDown.a = true;
        else if (keyRef === 68 || keyRef === 39)
            keysDown.d = true;
        else if (keyRef === 87 || keyRef === 38)
            keysDown.w = true;
        else if (keyRef === 32)
            keysDown.space = true;
        else if (keyRef === 70)
            keysDown.f = true;
        else if (keyRef === 82)
            keysDown.r = true;
        
        // Controls "Pause"
        if (keyRef === 80 && !inmenu)
        {
            paused = !paused;
        }

        // Controls Music
        if (keyRef === 77)
        {
            controlMusic();
        }

        // Starts the game if it is in menu mode.
        if (keyRef === 13)
        {
            if (inmenu)
            {
                inmenu = false;
                messages = [];
            }
        }

        // Starts and stops test mode.
        if (keyRef === 73)
        {
            testmode = !testmode;
        }

        /* Controls Sounds. The DShot sound is controlled
        the "newDShot" function. The LShot sound is 
        controlled in the "fireL" function. */
        var inframe = (player.pos[0] > 0)

        if (!inmenu && !paused && inframe)
        {
            if (keysDown.w)
            {
                soundEngine.play();
            }
            if (keysDown.a || keysDown.d)
            {
                soundThruster.play();
            }
        }
    }
}

function keyReleased(event)
{
    /* Logs which keyboard keys are currently pressed.
    Necessary for smooth controls. */
    var keyRef = event.keyCode;
    if (keyRef === 65 || keyRef === 37)
        keysDown.a = false;
    else if (keyRef === 68 || keyRef === 39)
        keysDown.d = false;
    else if (keyRef === 87 || keyRef === 38)
        keysDown.w = false;
    else if (keyRef === 32)
        keysDown.space = false;
    else if (keyRef === 70)
        keysDown.f = false;
    else if (keyRef === 82)
        keysDown.r = false;

    // Control Sounds
    if (!keysDown.w)
    {
        soundEngine.pause();
        soundEngine.currentTime = 0;
    }
    if (!keysDown.a || !keysDown.d)
    {
        soundThruster.pause();
        soundThruster.currentTime = 0;
    }
    if (keyRef === 70 || player.lEnergy <= 0)
    {
        soundLShot.pause();
        soundLShot.currentTime = 0;
    }
}

function controlPlayer()
{
    // Control Player Ship based on keyboard input.
    var x = player.vel[0];
    var y = player.vel[1];
    var th = (player.rot/180) * Math.PI;
    if (keysDown.w)
    {
        // Controls what happens on "w".
        newvelx = x + 0.14 * Math.sin(th);
        newvely = y - 0.14 * Math.cos(th);
        player.vel = [newvelx, newvely];
    }
    if (keysDown.a)
    {
        // Controls what happens on "a".
        player.rot -= 4;
    }
    if (keysDown.d)
    {
        // Controls what happens on "d".
        player.rot += 4;
    }
    if (keysDown.space)
    {
        fireD();
    }
    if (keysDown.f)
    {
        fireL();
    }
    if (keysDown.r)
    {
        fireM();
    }
}

// MUSIC
function controlMusic()
{
    if (!music)
    {
        music = true;
        songTravaUDoma.play();
        songTravaUDoma.loop = true;
    }
    else if (music)
    {
        music = false;
        songTravaUDoma.pause();
        songTravaUDoma.currentTime = 0;
    }
}

// DISRUPTOR SHOTS
var dShots = [];
function newDShot(source)
{
    // Creates a dshot object from source object.
    var decay = 20;
    gunpos = rotateVertex(source.shape[0], source.rot);
    originx = source.pos[0] + gunpos[0];
    originy = source.pos[1] + gunpos[1];
    // newShot = [originx, originy, source.rot, decay];
    var newShot = {
        pos: [originx, originy],
        rot: source.rot,
        decay: decay,
        size: 1,
        type: "dShot",
        owner: source.type
    }
    dShots.push(newShot);
    // Cancels existing dShot sounds.
    soundDShot.pause();
    soundDShot.currentTime = 0;
    // Play the DShot sound.
    soundDShot.play();
}

function fireD()
{
    /* Controls disruptor fire rate. */
    if (player.dPower > 1)
    {
        newDShot(player);
        player.dPower = 0;
    }
    else
    {
        player.dPower += player.dRate;
    }
}

function moveDShots()
{
    /* Moves all disruptor shots or deletes if neecessary. */
    var numS = dShots.length;
    var shotSpeed = 10;
    for (i = 0; i < numS; i++)
    {
        if (dShots[i].decay <= 0)
        {
            dShots.splice(i,1);
        }
        else
        {
            th = (dShots[i].rot/180) * Math.PI;
            dShots[i].pos[0] = dShots[i].pos[0] + shotSpeed * Math.sin(th);
            dShots[i].pos[1] = dShots[i].pos[1] - shotSpeed * Math.cos(th);
            dShots[i].decay -= 0.1;
        }
        numS = dShots.length;
    }
}

function drawDShots()
{
    /* Draw all dShots */
    var numS = dShots.length;
    for (i = 0; i < numS; i++)
    {
        ctx.save();
        var x = dShots[i].pos[0];
        var y = dShots[i].pos[1];
        ctx.translate(x,y);
        ctx.fillStyle = "MediumTurquoise";
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, 2*Math.PI);
        ctx.fill();
        ctx.restore();
    }
}

// LASER SHOTS
var lShots = [];
function newLShot(source)
{
    /* Very similar to the newDShot function. */
    var decay = 1.2;
    gunpos = rotateVertex(source.shape[0], source.rot);
    originx = source.pos[0] + gunpos[0];
    originy = source.pos[1] + gunpos[1];
    var origin2 = rotateVertex(source.shape[0]);
    // newShot = [originx, originy, source.rot, decay];
    var newShot = {
        pos: [originx, originy],
        rot: source.rot + (-8 + 16*Math.random()),
        decay: decay,
        size: 1,
        type: "lShot",
        owner: source.type
    }
    lShots.push(newShot);
}

function fireL()
{
    /* Controls firing laser shots - both rate of fire
    and duration of fire. */
    if (player.lEnergy > 0)
    {
        soundLShot.play();
        if (player.lPower > 1)
        {
            for (z = 0; z < 10; z++)
            {
                newLShot(player);
                player.lPower = 0.00;
                player.lEnergy -= 0.7;
            }
        }
        else
        {
            player.lPower += player.lRate;
        }
    }
    if (player.lEnergy <= 20 && !lEnergyRestorationTriggered)
    {
        setTimeout(lEnergyRestore, 12000);
        setTimeout(showLEnergyStats, 16000);
        lEnergyRestorationTriggered = true;
        showLEnergyLevel = true;
    }
    if (player.lEnergy <= 0)
    {
        soundLShot.pause();
        soundLShot.currentTime = 0;
    }
}

function lEnergyRestore()
{
    player.lEnergy = 100;
    lEnergyRestorationTriggered = false;
}

function moveLShots()
{
    /* Moves all laser shots or deletes if neecessary. 
    Practically the same function as moveDShots. */
    var numS = lShots.length;
    var shotSpeed = 20;
    for (i = 0; i < numS; i++)
    {
        if (lShots[i].decay <= 0)
        {
            lShots.splice(i,1);
            numS--;
            i--;
        }
        else
        {
            th = (lShots[i].rot/180) * Math.PI;
            lShots[i].pos[0] = lShots[i].pos[0] + shotSpeed * Math.sin(th);
            lShots[i].pos[1] = lShots[i].pos[1] - shotSpeed * Math.cos(th);
            lShots[i].decay -= 0.1;
        }
        numS = lShots.length;
    }
}
function drawLShots()
{
    /* Draw all lShots */
    var numS = lShots.length;
    for (i = 0; i < numS; i++)
    {
        ctx.save();
        let x = lShots[i].pos[0];
        let y = lShots[i].pos[1];
        ctx.translate(x,y);
        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.moveTo(0,0);
        let tail = rotateVertex([0,8],lShots[i].rot);
        ctx.lineTo(tail[0], tail[1]);
        ctx.stroke();
        ctx.restore();
    }
}

function showLEnergyStats()
{
    showLEnergyLevel = false;
}

// MISSILES
var missiles = [];
function newMissile(source)
{
    /* Creates a missile object from source object. */
    var originx = source.shape[0][0];
    var originy = source.shape[0][1] - 10;
    var initialpos = rotateVertex([originx, originy], source.rot);
    // Initial velocity adds source drift.
    var speed = 0.8;
    var th = (source.rot/180) * Math.PI;
    var velx = speed*Math.sin(th) + source.vel[0];
    var vely = -speed*Math.cos(th) + source.vel[1];
    startx = source.pos[0] + initialpos[0];
    starty = source.pos[1] + initialpos[1];
    // New missile parameters.
    var newMissile = {
        shape: missileShape,
        pos: [startx, starty],
        vel: [velx, vely],
        rot: source.rot,
        rotv: 0,
        fuel: 36,
        lockedOn: false,
        target: NaN,
        aimpoint: NaN,
        targetPriority: 0,
        size: 2,
        type: "missile",
        owner: source.type,
        gradientFill: false,
        color: "DimGrey",
        color1: "DimGrey",
        color2: "DimGrey",
    }
    missiles.push(newMissile);
    // Cancels existing sounds.
    soundDShot.pause();
    soundDShot.currentTime = 0;
    // Play the missile sound.
    soundDShot.play();
}

function fireM()
{
    /* Function for firing missiles. */
    if (player.missileLoaded)
    {
        if (player.numMissiles > 0)
        {
            newMissile(player);
            player.numMissiles -= 1;
            player.missileLoaded = false;
            setTimeout(loadMissile, 500);
        }
    }
}

function loadMissile()
{
    player.missileLoaded = true;
}

function controlMissiles()
{
    /* Missile Guidance and effects. */
    numMissiles = missiles.length;
    for (m = 0; m < numMissiles; m++)
    {
        // Increase velocity to maximum if it is not the case.
        let misSpeed = distanceCalc([0,0], missiles[m].vel);
        if (misSpeed < 10)
        {
            misSpeed += 0.08;
            var th = (missiles[m].rot/180)*Math.PI;
            var newVelX = misSpeed*Math.sin(th);
            var newVelY = -misSpeed*Math.cos(th);
            missiles[m].vel = [newVelX, newVelY];
        }
        // Missile Seeking
        missileSeekFuse(missiles[m], false);
        if (!missiles[m].lockedOn)
        {
            missileSeek(missiles[m], 40, 1500);
            if (!missiles[m].lockedOn)
            {
                // Rotate the missile if it has no lock.
                missiles[m].rot -= 4;
                var missileSpeed = distanceCalc([0,0], missiles[m].vel);
                var th = (missiles[m].rot/180)*Math.PI;
                var newVelX = missileSpeed*Math.sin(th);
                var newVelY = -missileSpeed*Math.cos(th);
                missiles[m].vel = [newVelX, newVelY];
            }
        }
        missileSeek(missiles[m], 360, 250);

        // Missile Guidance
        if (missiles[m].lockedOn)
        {
            let tempAimPoint = firingSolutionCalculation(missiles[m]); // 
            missiles[m].aimpoint = [tempAimPoint[0] + missiles[m].target.pos[0], tempAimPoint[1] + missiles[m].target.pos[1]];
            var polarPath = polarPointDirection(missiles[m].pos, missiles[m].aimpoint);

            if ((angleConverter(missiles[m].rot) - polarPath[1]) < 10)
            {
                missiles[m].rot += 3;
            }
            else
            {
                missiles[m].rot -= 3;
            }

            var missileSpeed = distanceCalc([0,0], missiles[m].vel);
            var th = (missiles[m].rot/180)*Math.PI;
            var newVelX = missileSpeed*Math.sin(th);
            var newVelY = -missileSpeed*Math.cos(th);
            missiles[m].vel = [newVelX, newVelY];
        }

        // Missile Exhaust Generation
        let exhaustVertex = rotateVertex(missiles[m].shape[4], missiles[m].rot);
        let posx = missiles[m].pos[0] + exhaustVertex[0];
        let posy = missiles[m].pos[1] + exhaustVertex[1];
        let driftx = missiles[m].vel[0];
        let drifty = missiles[m].vel[1];
        explosion("missileExhaust", [posx, posy], [driftx, drifty], missiles[m].rot);
    }
}

function missileSeek(missile, seekAngle, seekDistance)
{
    /* Seek a target over a range in an arc in front
    of the missile. */
    numAsteroids = asteroids.length;
    if (asteroids.length !== 0)
    {
        for (i = 0; i < numAsteroids; i++)
        {
            var polardir = polarDirection(missile, asteroids[i]);
            if (missile.lockedOn)
            {
                var polarDirTarget = polarDirection(missile, missile.target);
                var distanceToTarget = polarDirTarget[0];
            }
            var th = polardir[1];
            var distance = polardir[0];
            var thdeviation = angleDeviation(th, missile.rot);
            if (distance <= seekDistance && thdeviation <= seekAngle/2)
            {
                let targetPriority = targetPrioritiser(asteroids[i], missile.owner);
                if(targetPriority > missile.targetPriority || (distance < distanceToTarget && targetPriority === missile.targetPriority))
                {
                    missile.target = asteroids[i];
                    missile.targetPriority = targetPrioritiser(asteroids[i], missile.owner);
                    missile.lockedOn = true;
                }
            }
        }
    }
}

function targetPrioritiser(object, source)
{
    /* Determines the priority of an object for the player. */
    if (source === "player")
    {
        if (object.type === "cat2Asteroid")
            return 50;
        else if (object.type === "cat1Asteroid")
            return 40;
    }
}

function firingSolutionCalculation(object)
{
    /* Calculates the position to aim for to hit the target
    with leading. Similar to the calculation of the blue path
    in the "drawObject" function. Output is an [x,y] velocity
    vector based on speed of the missile. */

    // 1. Work out the distance from missile to target.
    let rangeToTarget = distanceCalc(object.pos, object.target.pos);

    // 2. Work out how long it will take for the missile to cross this distance.
    let impactTime = rangeToTarget/distanceCalc([0,0], object.vel);

    // 3. Calculate the position to aim for. 
    // "lag" is an experimental parameter - can be used to control the "lead" percentage.
    let lag = 0.6;
    let aimx = lag*impactTime*object.target.vel[0];
    let aimy = lag*impactTime*object.target.vel[1];
    return [aimx, aimy];
}

function polarDirection(object1, object2)
{
    /* Converts a cartesian vector from one object to another
    into polar coordinates. */
    let o1x = object1.pos[0];
    let o1y = object1.pos[1];
    let o2x = object2.pos[0];
    let o2y = object2.pos[1];
    let dy = o1y - o2y;
    let dx = o2x - o1x;
    let distance = Math.sqrt(dx*dx + dy*dy);
    let th = 180*Math.atan(dy/dx)/Math.PI;
    if (dy >= 0 && dx <= 0)
        th = th + 180;
    else if (dy <= 0 && dx <= 0)
        th = th + 180;
    else if (dy <= 0 && dx >= 0)
        th = th + 360;
    // Adjust to canvas coordinates:
    th = (360 - th + 90) % 360;
    return [distance, th];
}

function polarPointDirection(point1, point2)
{
    /* Converts a cartesian vector from one point to another
    into polar coordinates. */
    let o1x = point1[0];
    let o1y = point1[1];
    let o2x = point2[0];
    let o2y = point2[1];
    let dy = o1y - o2y;
    let dx = o2x - o1x;
    let distance = Math.sqrt(dx*dx + dy*dy);
    let th = 180*Math.atan(dy/dx)/Math.PI;
    if (dy >= 0 && dx <= 0)
        th = th + 180;
    else if (dy <= 0 && dx <= 0)
        th = th + 180;
    else if (dy <= 0 && dx >= 0)
        th = th + 360;
    // Adjust to canvas coordinates:
    th = (360 - th + 90) % 360;
    return [distance, th];
}

function angleConverter(angle)
{
    /* Converts an angle in degrees which may
    be negative or greater than 360 to one that
    is between 0 and 360 degrees. */
    if (angle >= 0)
    {
        return (angle % 360);
    }
    else if (angle < 0)
    {
        while (angle < 0)
        {
            angle += 360;
        }
        return angle;
    }
}

function angleDeviation(angle1, angle2)
{
    /* Gives the difference between two angles
    between 0 degrees and +180 degrees. */
    var a1 = angleConverter(angle1);
    var a2 = angleConverter(angle2);
    var dev = Math.abs(a1 - a2);
    if (dev > 180)
        dev = 360 - dev;
    return dev;
}

function distanceCalc(point1, point2)
{
    /* Helper function - calculated the distance
    between two points. */
    let dy = point2[1] - point1[1];
    let dx = point2[0] - point1[0];
    return Math.sqrt(dy*dy + dx*dx);
}

function missileSeekFuse(missile, force)
{
    /* This function blows the missile up if it is
    located at a set distance from a target or if
    it runs out of fuel. Also blows up the missile
    if it has collided with something. */
    var inRangeOfTarget = false;
    if (missile.lockedOn)
    {
        inRangeOfTarget = generalProximityDetection(missile, missile.target, 80);
    }
    if (inRangeOfTarget || missile.fuel <= 0)
    {
        missile.size = 100;
        missile.fuel = -1;
        missileAreaEffect(missile);
    }
    if (force)
    {
        missile.size = 100;
        missile.fuel = -1;
        missileAreaEffect(missile);
    }
}

function missileAreaEffect(missile)
{
    /* Destroy all objects located in missile's area
    of effect. */
    var numAsteroids = asteroids.length;
    explosion("missileExplosion", missile.pos, missile.vel, 0)
    for (k = 0; k < numAsteroids; k++)
    {
        if (generalCollisionDetection(missile, asteroids[k]))
        {
            asteroids[k].health = -1;
            if (asteroids[k].cat === 2)
            {
                /*newAsteroids = genAsteroids(2,1)
                for (c = 0; c < 2; c++)
                {
                    newAsteroids[c].pos[0] = asteroids[k].pos[0];
                    newAsteroids[c].pos[1] = asteroids[k].pos[1];
                }
                asteroids = asteroids.concat(newAsteroids);*/
                asteroids[k].remove = true;
            }
        }
    }
}

function generalProximityDetection(missile, target, range)
{
    /* Detects whether two objects are within a certain range
    of each other.*/

    // This is the distance at which a collision is registered.
    var minDistance = range + target.size;

    // This is the actual distance between the two objects.
    var dx = missile.pos[0] - target.pos[0];
    var dy = missile.pos[1] - target.pos[1];
    var distance = Math.sqrt(dx*dx + dy*dy);

    // Return result.
    return (distance <= minDistance);
}

function moveMissiles()
{
    /* Function for missile movement. For now, missiles
    are "dumb". They will be made "homing" later. */
    var numMissiles = missiles.length;
    if (numMissiles > 0)
    {
        soundMissile.play();
        soundMissile.loop = true;
    }
    else if (numMissiles === 0)
    {
        soundMissile.pause();
        soundMissile.currentTime = 0;
    }
    for (i = 0; i < numMissiles; i++)
    {
        if (missiles[i].fuel <= 0)
        {
            missiles.splice(i,1);
            numMissiles--;
            i--;
        }
        else
        {
            moveObject(missiles[i]);
            missiles[i].fuel -= 0.1;
        }
    }
}

function drawMissiles()
{
    /* This function draws missiles using the
    "drawObject" function. */
    var numMissiles = missiles.length;
    for (i = 0; i < numMissiles; i++)
    {
        drawObject(missiles[i]);
    }
}

// ASTEROIDS
var asteroids = [];
function newAsteroid(size)
{
    /* Creates a new asteroid. It must be move and rotate at
    random, and should not spawn around the player. This only
    creates the asteroid in memory, but doesn't draw it.*/
    rockShape = [];
    sizeMult = 40;
    for (i = 0; i < 16; i++)
    {
        th = ((i)/16) * 2 * Math.PI;
        newx = size * sizeMult * Math.cos(th) * (0.8 + 0.4*Math.random());
        newy = size * sizeMult * Math.sin(th) * (0.8 + 0.4*Math.random());
        rockShape.push([newx, newy]);
    }
    th = 2*Math.PI*Math.random();
    posx = player.pos[0] + ((500+200*Math.random())*Math.cos(th));
    posy = player.pos[1] - ((500+200*Math.random())*Math.sin(th));
    newRock = {
        shape: rockShape,
        type: "cat" + parseInt(size) + "Asteroid",
        pos: [posx, posy],
        rot: 0,
        rotv: Math.round(-2+4*Math.random()),
        vel: [Math.round(-5 + 10*Math.random()),Math.round(-5 + 10*Math.random())],
        health: 10 * size * size * size,
        remove: false,
        color: "#303030",
        gradientFill: true,
        color1: "DimGrey",
        color2: "#303030",
        cat: size,
        size: size*sizeMult
    }
    return newRock;
}

function genAsteroids(n, size)
{
    /* Generates n asteroids of a particular size. */
    var listAst = [];
    var i;
    for (i = 0; i < n; i++)
    {
        var newAst = newAsteroid(size);
        listAst.push(newAst);
    }
    return listAst;
}

function moveAsteroids()
{
    /* Moves all asteroids based on their velocity
    and transports them over to other side when they
    reach the edge. Utilises moveObject. */
    var numastr = asteroids.length;
    for (i = 0; i < numastr; i++)
    {
        moveObject(asteroids[i]);
    }
}

function freezeAsteroids()
{
    /* Freezes all asteroids. Useful for testing
    weapons. */
    var numastr = asteroids.length;
    for (i = 0; i < numastr; i++)
    {
        asteroids[i].vel = [0,0];
    }
}

function drawAsteroids()
{
    /* Draws all asteroids. */
    var numastr = asteroids.length;
    for (i = 0; i < numastr; i++)
    {
        drawObject(asteroids[i]);
    }
}

// DRAWING STARS
function genStars(n)
{
    /* Generates n stars, with coordinates based on canvas size and
    color picked at random from the list of colors.*/
    colorslist = ["LightSkyBlue", "Chocolate", "DarkSalmon", "DimGrey"];
    colorsnum = colorslist.length;
    listStars = [];
    for (i = 0; i < n; i++)
    {
        starX = Math.round(sizeX * Math.random());
        starY = Math.round(sizeY * Math.random());
        starcolor = colorslist[Math.round(colorsnum * Math.random())];
        listStars.push([starX, starY, starcolor]);
    }
    return listStars;
}

var stars = genStars(100);

function drawStars()
{
    // Draws a list of stars as points on canvas.
    n = stars.length;
    ctx.save();
    for (i = 0; i < n; i++)
    {
        ctx.fillStyle = stars[i][2];
        ctx.beginPath();
        ctx.arc(stars[i][0], stars[i][1], 1 , 0, 2*Math.PI);
        ctx.fill();
    }
    ctx.restore();
}

// SPACE DUST
function genSpaceDust()
{   
    if (Math.random() > 0.96)
    {
        var th = 2 * Math.PI * Math.random();
        let posx = (sizeX/2) + 0.7 * sizeX * Math.sin(th);
        let posy = (sizeY/2) - 0.7 * sizeY * Math.cos(th);
        explosion("spaceDust", [posx, posy], [0,0]);
    }
}

// PARTICLES
particles = [];
function genParticle(origin, decay, decaymin, direction, drift, spread, avgspeed, speedvar, color)
{
    /* This function generates a single particle given initial
    location, source and source speed. The movement is in a radial
    direction away from the source, with random angle. The angle is
    contained by the spread. The function is somewhat based on the 
    DShot function. Decay is also used. */
    var partdecay = decay * (decaymin + (1-decaymin)*2*Math.random());
    var speed = avgspeed * (speedvar + (1-speedvar)*2*Math.random());
    var th = ((direction - (0.5*spread))/180 + (spread/180) * Math.random()) * Math.PI;
    var newParticle = {
        pos: origin,
        vel: [speed*Math.sin(th) + drift[0], -speed*Math.cos(th) + drift[1]],
        decay: partdecay,
        color: color
    }
    particles.push(newParticle);
}

function moveParticles(particleList)
{
    /* Moves all particles as required. Deletes decayed particles.
    Method adapted from dShots. */
    var numParticles = particleList.length;
    for (d = 0; d < numParticles; d++)
    {
        if (particleList[d].decay <= 0)
        {
            particleList.splice(d,1);
            d--;
        }
        else
        {
            particleList[d].pos[0] = particleList[d].pos[0] + particleList[d].vel[0]
            particleList[d].pos[1] = particleList[d].pos[1] + particleList[d].vel[1]
            particleList[d].decay -= 0.1;
        }
        numParticles = particleList.length;
    }
}

function makeParticles(n, origin, decay, decaymin, direction, drift, spread, avgspeed, speedvar, colorset)
{
    /* This function generates n particles from a given source and with a given
    decay. The spread is the angle variation. (i.e 1 for full radial dispersal, 0 for
    dispersal in one direction) Colors from a particular colorset are taken. The 
    same function can be used for all particle generation. Additional drift can be set. */
    var originx = origin[0];
    var originy = origin[1];
    numColors = colorset.length;
    for (i = 0; i < n; i++)
    {
        color = colorset[Math.round(numColors*Math.random())];
        genParticle([originx, originy], decay, decaymin, direction, drift, spread, avgspeed, speedvar, color);
    }
}

function drawParticles(particleList)
{
    /* Draw all particles. */
    var numP = particleList.length;
    ctx.save();
    for (i = 0; i < numP; i++)
    {
        ctx.fillStyle = particleList[i].color;
        ctx.beginPath();
        ctx.arc(particleList[i].pos[0], particleList[i].pos[1], 1, 0, 2*Math.PI);
        ctx.fill();
    }
    ctx.restore();
}

function explosion(type, pos, drift, direction)
{
    /* All explosion effects are in this one function. This is done
    for the purpose of making it easier to change explosion effects.
    The argument is the reference of the explosion effect and the
    position of the explosion. */

    /* The general explosion consists of primary color particles in a
    full spread with a long delay and slow speed */
    if (type === "general")
    {
        let colorSet = ["red", "blue", "green"];
        let num = 1000;
        let decay = 40;
        let decaymin = 0.4;
        let direction = 0;
        let spread = 360;
        let speed = 1;
        let speedvar = 0.6;
        makeParticles(num, pos, decay, decaymin, direction, drift, spread, speed, speedvar, colorSet);
    }
    if (type === "dShotImpact")
    {
        let colorSet = ["grey", "white", "beige", "WhiteSmoke", "PapayaWhip"];
        let num = 16;
        let decay = 4;
        let decaymin = 0.4;
        let direction = 0;
        let spread = 360;
        let speed = 1.5;
        let speedvar = 0.6;
        makeParticles(num, pos, decay, decaymin, direction, drift, spread, speed, speedvar, colorSet);
    }
    if (type === "lShotImpact")
    {
        let colorSet = ["grey", "white", "pink", "red", "Chocolate"];
        let num = 6;
        let decay = 4;
        let decaymin = 0.4;
        let direction = 0;
        let spread = 360;
        let speed = 1.5;
        let speedvar = 0.6;
        makeParticles(num, pos, decay, decaymin, direction, drift, spread, speed, speedvar, colorSet);
    }
    if (type === "cat1AsteroidExplosion")
    {
        let colorSet = ["grey", "white", "beige", "WhiteSmoke", "PapayaWhip"];
        let num = 150;
        let decay = 6;
        let decaymin = 0.3;
        let direction = 0;
        let spread = 360;
        let speed = 2;
        let speedvar = 0.6;
        makeParticles(num, pos, decay, decaymin, direction, drift, spread, speedvar, speed, colorSet);
    }
    if (type === "cat2AsteroidExplosion")
    {
        let colorSet = ["grey", "white", "beige", "WhiteSmoke", "PapayaWhip"];
        let num = 300;
        let decay = 10;
        let decaymin = 0.3;
        let direction = 0;
        let spread = 360;
        let speed = 1.5;
        let speedvar = 0.6;
        makeParticles(num, pos, decay, decaymin, direction, drift, spread, speedvar, speed, colorSet);
    }
    if (type === "playerShipExplosion")
    {
        let colorSet = ["beige", "Chocolate", "DarkOrange", "DarkRed", "GoldenRod"];
        let colorSet1 = ["cyan", "darkblue", "lightseagreen", "mediumpurple"]
        let num = 600;
        let decay = 20;
        let decaymin = 0.3;
        let direction = 0;
        let spread = 360;
        let speed = 5;
        let speedvar = 0.6;
        makeParticles(num, pos, decay, decaymin, direction, drift, spread, speedvar, speed, colorSet);
        makeParticles(750, pos, 5, 0.9, direction, drift, spread, 40, 0.92, colorSet1);
        soundShipExplosion.pause();
        soundShipExplosion.currentTime = 0;
        soundShipExplosion.play();
    }
    if (type === "engineExhaust")
    {
        let colorSet1 = ["orange", "Chocolate", "Orange", "Chocolate", "DarkRed"];
        let num = 6;
        let decay = 1.5;
        let decaymin = 0.6;
        let direction = player.rot + 180;
        let spread = 16;
        let speed = 2;
        let speedvar = 0.6;
        makeParticles(num, pos, decay, decaymin, direction, drift, spread, speed, speedvar, colorSet1);
    }
    if (type === "leftShipThruster")
    {
        let colorSet1 = ["orange", "Chocolate", "Orange", "Chocolate", "DarkRed"];
        let num = 2;
        let decay = 0.2;
        let decaymin = 0.95;
        let direction = player.rot;
        let spread = 1;
        let speed = 6;
        let speedvar = 0.6;
        makeParticles(num, pos, decay, decaymin, direction-90, drift, spread, speed, speedvar, colorSet1);
    }
    if (type === "rightShipThruster")
    {
        let colorSet1 = ["orange", "Chocolate", "Orange", "Chocolate", "DarkRed"];
        let num = 2;
        let decay = 0.2;
        let decaymin = 0.95;
        let direction = player.rot;
        let spread = 1;
        let speed = 6;
        let speedvar = 0.6;
        makeParticles(num, pos, decay, decaymin, direction+90, drift, spread, speed, speedvar, colorSet1);
    }
    if (type === "missileExhaust")
    {
        let colorSet = ["orange", "Chocolate", "Orange", "Chocolate", "DarkRed"];
        let num = 5;
        let decay = 0.8;
        let decaymin = 0.7;
        let dir = direction + 180;
        let spread = 1;
        let speed = 4;
        let speedvar = 0.6;
        makeParticles(num, pos, decay, decaymin, dir, drift, spread, speed, speedvar, colorSet);
    }
    if (type === "missileExplosion")
    {
        let colorSet = ["cyan", "darkblue", "lightseagreen", "mediumpurple"]
        let num = 500;
        let decay = 4;
        let decaymin = 0.4;
        let direction = 0;
        let spread = 360;
        let speed = 0.6;
        let speedvar = 2.5;
        makeParticles(num, pos, decay, decaymin, direction, drift, spread, speedvar, speed, colorSet);
        soundShipExplosion.pause();
        soundShipExplosion.currentTime = 0;
        soundShipExplosion.play();
    }
    if (type === "spaceDust")
    {
        randomnum = Math.random()
        let colorSet1 = ["white", "grey", "beige", "SkyBlue"];
        let num = 1;
        let decay = 150;
        let decaymin = 0.9;
        let direction = Math.round(360*randomnum);
        let spread = 0;
        let speed = 1 * randomnum;
        let speedvar = 0.9;
        makeParticles(num, pos, decay, decaymin, direction, drift, spread, speed, speedvar, colorSet1);
    }
}

// DRAWING OBJECTS
function drawObject(object)
{
    /* This function draws any object based on input thay
    provides it with its vertices and a position. */
    type = object.shape;
    pos = object.pos;
    rot = object.rot;

    ctx.save();
    var x = pos[0]; 
    var y = pos[1];

    // Detect if object is out of screen bounds.
    var outOfBounds = false;
    var dotx = x;
    var doty = y;
    if (x < 0)
    {
        dotx = 10;
        outOfBounds = true;
    }
    else if (x > sizeX)
    {
        dotx = sizeX-5;
        outOfBounds = true;
    }
    if (y < 0)
    { 
        doty = 5
        outOfBounds = true;
    }
    else if (y > sizeY)
    {
        doty = sizeY-5;
        outOfBounds = true;
    }

    // Draw a dot if the object is out of bounds.
    if (outOfBounds)
    {
        ctx.save();
        ctx.translate(dotx, doty);
        ctx.fillStyle = "dimgrey";
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, 2*Math.PI);
        ctx.fill();
        ctx.restore();
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    let TH = (rot/180) * Math.PI;
    var sinTH = Math.sin(TH);
    var cosTH = Math.cos(TH);
    //afterRotation = rotateVertex(type[0], rot);
    afterRotation = rotateVertexPer(type[0], sinTH, cosTH);
    ctx.moveTo(afterRotation[0], afterRotation[1]);
    for (var i = 1; i < type.length; i++)
    {
        afterRotation = rotateVertexPer(type[i], sinTH, cosTH);
        ctx.lineTo(afterRotation[0], afterRotation[1]);
    }
    ctx.closePath();

    ctx.lineWidth = 1;
    ctx.strokeStyle = object.color;
    ctx.stroke();

    if (object.gradientFill)
    {
        // For Gradient Fill
        var grd = ctx.createRadialGradient(0,0,object.size/12,0,0,object.size);
        grd.addColorStop(0, object.color1);
        grd.addColorStop(1, object.color2);
        ctx.fillStyle = grd;
        ctx.fill();
    }
    else
    {
        ctx.fillStyle = object.color;
        ctx.fill();
    }
    if (testmode)
    {
        /* This is useful for designing the missile guidance algorithms,
        and generally looks cool. */
        ctx.font = "12px Consolas";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("POS: X: " + parseInt(object.pos[0]) + ", Y: " + parseInt(object.pos[1]), 0, 60);
        ctx.fillText("VEL: X: " + parseFloat(object.vel[0].toFixed(1)) + ", Y: " + parseFloat(object.vel[1].toFixed(1)), 0, 74);
        ctx.fillText("ROT: " + parseInt(object.rot), 0, 88);
        if (object.type === "missile")
        {
            // Proximity Fuse Radius
            ctx.beginPath();
            ctx.lineWidth = 0.5;
            ctx.strokeStyle = "yellow";
            ctx.setLineDash([10, 10]);
            ctx.arc(0, 0, 40, 0, 2*Math.PI);
            ctx.stroke();
            // Label
            ctx.font = "12px Consolas";
            ctx.fillStyle = "yellow";
            ctx.textAlign = "center";
            ctx.fillText("PROXIMITY", 0, -60);
            ctx.fillText("FUSE ZONE", 0, -46);

            // Current path of missile
            ctx.beginPath();
            ctx.moveTo(0,0);
            ctx.lineTo(2000*object.vel[0], 2000*object.vel[1]);
            // Label
            ctx.font = "12px Consolas";
            ctx.fillStyle = "green";
            ctx.textAlign = "center";
            ctx.fillText("CURRENT", 50*object.vel[0], 50*object.vel[1] + 25);
            ctx.fillText("MISSILE PATH", 50*object.vel[0], 50*object.vel[1] + 39);
            // Continue
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 8]);
            ctx.strokeStyle = "green";
            ctx.stroke();

            if (object.lockedOn)
            {
                // Lock-On Information
                ctx.fillStyle = "white";
                ctx.fillText("LOCK: X: " + parseFloat(object.target.pos[0].toFixed(1)) + ", Y: " + parseFloat(object.target.pos[1].toFixed(1)), 0, 100);

                // Path to target - direct
                ctx.beginPath();
                ctx.moveTo(0,0);
                ctx.restore();
                ctx.lineTo(object.target.pos[0], object.target.pos[1]);
                ctx.closePath();
                // Label
                ctx.font = "12px Consolas";
                ctx.fillStyle = "red";
                ctx.textAlign = "center";
                ctx.fillText("DIRECT PATH", object.target.pos[0], object.target.pos[1] + 25);
                ctx.fillText("TO TARGET", object.target.pos[0], object.target.pos[1] + 39);
                // Continue
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 15]);
                ctx.strokeStyle = "red";
                ctx.stroke();

                // Draw Target Dot
                ctx.restore();
                ctx.translate(object.target.pos[0], object.target.pos[1]);
                ctx.fillStyle = "red";
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, 2*Math.PI);
                ctx.fill();

                // Path to target - leading
                ctx.restore();
                ctx.translate(x,y);
                ctx.beginPath();
                ctx.moveTo(0,0);
                ctx.restore();
                ctx.translate(object.target.pos[0], object.target.pos[1]);
                // Need to work out where the target will be given missile speed and target speed.
                // 1. Work out distance from missile to target.
                let rangeToTarget = distanceCalc(object.pos, object.target.pos);
                // 2. Work out how long it will take for the missile to cross this distance.
                let impactTime = rangeToTarget/distanceCalc([0,0], object.vel);
                // 3. Multiply impactTime by the velocity of the target to get leading aiming point.
                ctx.lineTo(impactTime*object.target.vel[0], impactTime*object.target.vel[1]);
                // Label
                ctx.font = "12px Consolas";
                ctx.fillStyle = "blue";
                ctx.textAlign = "center";
                ctx.fillText("LEADING PATH", impactTime*object.target.vel[0], impactTime*object.target.vel[1] + 25);
                ctx.fillText("TO TARGET", impactTime*object.target.vel[0], impactTime*object.target.vel[1] + 39);
                ctx.closePath();
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 15]);
                ctx.strokeStyle = "blue";
                ctx.stroke();

                // Current Missile Aimpoint
                ctx.restore();
                ctx.translate(object.aimpoint[0], object.aimpoint[1]);
                ctx.lineWidth = 0.5;
                ctx.strokeStyle = "magenta";
                ctx.setLineDash([10, 10]);
                ctx.arc(0, 0, 10, 0, 2*Math.PI);
                ctx.stroke();
                // Label
                ctx.font = "12px Consolas";
                ctx.fillStyle = "magenta";
                ctx.textAlign = "center";
                ctx.fillText("MISSILE", 0, -30);
                ctx.fillText("AIM POINT", 0, -16);
                ctx.restore();
            }
            else
            {
                ctx.fillStyle = "white";
                ctx.fillText("NO LOCK", 0, 100);
            }
        }
    }

    ctx.restore();
}

function drawStats()
{
    ctx.save();
    ctx.font = "bold 18px Consolas";
    ctx.fillStyle = "lightgrey";
    ctx.textAlign = "left";
    ctx.fillText("LEVEL: " + level, 25, 30);
    ctx.fillText("SHIPS: " + player.ships, 125, 30);
    missilesString = ""
    for (m = 0; m < player.numMissiles; m++)
    {
        missilesString += "\u0394";
    }
    ctx.fillText("MISSILES: " + missilesString, 225, 30);
    ctx.fillText("SCORE: " + score, 25, 55);
    if (paused)
    {
        ctx.font = "24px Verdana";
        ctx.fillStyle = "lightgrey";
        ctx.textAlign = "center";
        ctx.fillText('Game paused. Press "P" to unpause.', sizeX/2, sizeY/3);
    }
    else
    {
        ctx.font = "10px Verdana";
        ctx.fillStyle = "lightgrey";
        ctx.textAlign = "left";
        ctx.fillText('Press "P" to pause game.', 5, sizeY-18);
    }
    if (!music)
    {
        ctx.font = "10px Verdana";
        ctx.fillStyle = "lightgrey";
        ctx.textAlign = "left";
        ctx.fillText('Press "M" to play cool space music!', 5, sizeY-6);
    }
    else if (music)
    {
        ctx.font = "10px Verdana";
        ctx.fillStyle = "lightgrey";
        ctx.textAlign = "left";
        ctx.fillText('Press "M" to stop music.', 5, sizeY-6);
    }
    ctx.restore();
    drawPlayerStats();
}

function rotateVertex(vertex, angle)
{
    /* Function to rotate a vertex around a specified angle.
    The angle should be in degrees. */
    var x = vertex[0];
    var y = vertex[1];
    var th = (angle/180) * Math.PI;
    newx = x * Math.cos(th) - y * Math.sin(th);
    newx = Math.round(newx);
    newy = x * Math.sin(th) + y * Math.cos(th);
    newy = Math.round(newy);
    return [newx, newy];
}

function rotateVertexPer(vertex, sinth, costh)
{
    /* Function to rotate a vertex around a specified angle.
    The angle should be in degrees. */
    var x = vertex[0];
    var y = vertex[1];
    newx = x * costh - y * sinth;
    newy = x * sinth + y * costh;
    return [newx, newy];
}

function moveObject(object)
{
    /* This function is for moving objects based on their
    velocity vector. It translates the object to the other
    side of the canvas if it reaches the edge. */
    var pos = object.pos;
    var vel = object.vel;
    var rotv = object.rotv;
    var margin = 100;
    if (pos[0] < -margin)
    {
        newx = sizeX + margin;
    }
    else if (pos[0] > sizeX + margin)
    {
        newx = -margin;
    }
    else
    {
        newx = pos[0] + vel[0];
    }
    if (pos[1] < -margin)
    {
        newy = sizeY + margin;
    }
    else if (pos[1] > sizeY + margin)
    {
        newy = -margin;
    }
    else
    {
        newy = pos[1] + vel[1];
    }
    object.rot = object.rot + rotv;
    object.pos = [newx, newy];
}

function movePlayer(object)
{
    /* This function is for moving the player based on his
    velocity vector. Collision with edge of resets position.
    It can be used for any object that can collide with the
    edge of the canvas. */
    var pos = object.pos;
    var x = pos[0];
    var y = pos[1];
    var vel = object.vel;
    if (x < 0 || x > sizeX)
    {
        playerDestroyed();
    }
    else if (y < 0 || y > sizeY)
    {
        playerDestroyed();
    }
    else
    {
        // Engine exhaust and lateral thrusters!
        if (keysDown.w)
        {
            let vertex = rotateVertex(object.shape[2], object.rot);
            let originx = object.pos[0] + vertex[0];
            let originy = object.pos[1] + vertex[1];
            explosion("engineExhaust", [originx, originy], object.vel);
        }
        if (keysDown.a)
        {
            let vertex = rotateVertex(object.shape[0], object.rot);
            let originx = object.pos[0] + vertex[0];
            let originy = object.pos[1] + vertex[1];
            explosion("rightShipThruster", [originx, originy], object.vel);
            vertex = rotateVertex(object.shape[3], object.rot);
            originx = object.pos[0] + vertex[0];
            originy = object.pos[1] + vertex[1];
            explosion("leftShipThruster", [originx, originy], object.vel);
        }
        if (keysDown.d)
        {
            vertex = rotateVertex(object.shape[0], object.rot);
            originx = object.pos[0] + vertex[0];
            originy = object.pos[1] + vertex[1];
            explosion("leftShipThruster", [originx, originy], object.vel);
            vertex = rotateVertex(object.shape[1], object.rot);
            originx = object.pos[0] + vertex[0];
            originy = object.pos[1] + vertex[1];
            explosion("rightShipThruster", [originx, originy], object.vel);
        }
        newx = x + vel[0];
        newy = y + vel[1];
        object.pos = [newx, newy];
    }
}

// COLLISION DETECTION
function generalCollisionDetection(object1, object2)
{
    /* Detects a collision between two objects based on their
    size property with circular collision zones. Returns true
    or false depending on whether a collision has occured. */

    // This is the distance at which a collision is registered.
    var minDistance = object1.size + object2.size;

    // This is the actual distance between the two objects.
    var dx = object1.pos[0] - object2.pos[0];
    var dy = object1.pos[1] - object2.pos[1];
    var distance = Math.sqrt(dx*dx + dy*dy);

    // Return result.
    return (distance <= minDistance);
}

function collisionsAsteroids()
{
    /* This detects all asteroid collisions and weapons
    impacts. */
    var numAsteroids = asteroids.length;
    var numDShots = dShots.length;
    var numLShots = lShots.length;
    var numMissiles = missiles.length;
    
    if (numAsteroids > 0)
    {
        for (a = 0; a < numAsteroids; a++)
        {
            // Collisions with the player
            if (generalCollisionDetection(asteroids[a], player) && !invincibility)
            {
                asteroids[a].health = -1;
                explosion("cat2AsteroidExplosion",asteroids[a].pos, asteroids[a].vel);
                playerDestroyed();
            }
            // Collisions with dShots
            if (numDShots > 0)
            {
                for (b = 0; b < numDShots; b++)
                {
                    if (generalCollisionDetection(asteroids[a], dShots[b]))
                    {
                        soundShotImpact.pause();
                        soundShotImpact.currentTime = 0;
                        asteroids[a].health -= 5;
                        explosion("dShotImpact", dShots[b].pos, [0,0]);
                        if (dShots[b].owner === "player")
                        {
                            score += 1;
                            if (asteroids[a].health <= 0)
                            {
                                score += 10*asteroids[a].cat;
                            }
                        }
                        dShots.splice(b, 1);
                        numDShots--;
                        b--;
                        soundShotImpact.play();
                    }
                }
            }
            // Collisions with laser shots
            if (numLShots > 0)
            {
                for (b = 0; b < numLShots; b++)
                {
                    if (generalCollisionDetection(asteroids[a], lShots[b]))
                    {
                        asteroids[a].health -= 5;
                        explosion("dShotImpact", lShots[b].pos, [0,0]);
                        if (lShots[b].owner === "player")
                        {
                            score += 1;
                            if (asteroids[a].health <= 0)
                            {
                                score += 10*asteroids[a].cat;
                            }
                        }
                        lShots.splice(b, 1);
                        numLShots--;
                        b--;
                    }
                }
            }
            // Collisions with missiles
            if (numMissiles > 0)
            {
                for (b = 0; b < numMissiles; b++)
                {
                    if (generalCollisionDetection(asteroids[a], missiles[b]))
                    {
                        asteroids[a].health = -1;
                        asteroids[a].remove = true;
                        missileSeekFuse(missiles[b], true);
                        if (missiles[b].owner === "player")
                        {
                            score += 10 * asteroids[a].cat;
                        }
                    }
                }
            }
        }
    }
}

// CLEANUP
function cleanupAsteroids()
{
    /* Get rid of asteroids with <0 health */
    var numAsteroids = asteroids.length;
    var newAsteroids = [];
    for(a = 0; a < numAsteroids; a++)
    {
        if (asteroids[a].health <= 0)
        {
            soundAsteroidExplosion.pause();
            soundAsteroidExplosion.currentTime = 0;
            numMissiles = missiles.length;
            for (g = 0; g < missiles.length; g++)
            {
                if (missiles[g].target === asteroids[a])
                {
                    missiles[g].target = NaN;
                    missiles[g].lockedOn = false;
                    missiles[g].target = NaN;
                    missiles[g].aimpoint = NaN;
                    missiles[g].targetPriority = 0;
                }
            }
            if (asteroids[a].cat === 2)
            {
                explosion("cat2AsteroidExplosion", asteroids[a].pos, [0,0]);
                if (!asteroids[a].remove)
                {
                    newAsteroids = genAsteroids(4,1)
                    for (c = 0; c < 4; c++)
                    {
                        newAsteroids[c].pos[0] = asteroids[a].pos[0];
                        newAsteroids[c].pos[1] = asteroids[a].pos[1];
                    }
                    asteroids = asteroids.concat(newAsteroids);
                }
            }
            if (asteroids[a].cat === 1)
            {
                explosion("cat1AsteroidExplosion", asteroids[a].pos, asteroids[a].vel);
            }
            asteroids.splice(a, 1);
            numAsteroids--;
            a--;
            soundAsteroidExplosion.play();
        }
    }
}

// GAME MECHANICS
function gameMech()
{
    /* Controls the game mechanics. */
    if (!inmenu)
    {
        if (level === 0)
        {
            asteroids = [];
            gameNum += 1;
            score = 0;
            player = createShip();
        }
        if (asteroids.length === 0 && !lgTriggered)
        {
            score += 100*level;
            if (level > 0)
            {
                text = "Well done, Cadet!";
                newMessage(text, [sizeX/2, sizeY/3 - 50], "36px Segoe UI", "lightgrey", "center", 15, true);
                player.ships += 1;
                let newMissileNumber = player.numMissiles + 4;
                player.numMissiles = Math.min(newMissileNumber, 24);
            }
            level += 1;
            text = "Level " + parseInt(level) + ". Get ready!";
            newMessage(text, [sizeX/2, sizeY/3 + 60], "48px Segoe UI", "lightgrey", "center", 20, true);
            lgTriggered = true;
        }
        if (messages.length === 0 && lgTriggered)
        {
            levelGenerator();
            lgTriggered = false;
        }
    }
}

function levelGenerator()
{
    /* Generates a level based on current value of "level" variable. */
    numAst1 = Math.min(level*2, 6);
    numAst2 = Math.min(level, 20);
    asteroids = [];
    asteroids = asteroids.concat(genAsteroids(numAst2, 2));
    asteroids = asteroids.concat(genAsteroids(numAst1, 1));
}

function playerDestroyed()
{
    /* This controls what happens when the player's ship
    is destroyed. */
    if (invincibility === false)
    {
        explosion("playerShipExplosion", player.pos, [0,0]);
        if (player.ships > 0)
        {
            player.pos = [-500, -500];
            player.ships -= 1;
            invincibility = true;
            controlLock = true;
            setTimeout(playerReSpawn, 3000);
            setTimeout(cancelInvincibility, 6000);
        }
        else
        {
            player.ships = 0;
            gameOver();
        }
    }
}

function playerReSpawn()
{
    /* Respawns the player in the middle of the screen. */
    player.vel = [0, 0];
    player.rot = 0;
    player.pos = [Math.round(sizeX/2), Math.round(sizeY/2)];
    controlLock = false;
}

function cancelInvincibility()
{
    /* Cancels invincibility after the player has been destroyed. */
    invincibility = false;
}

function drawPlayerStats()
{
    /* Draws the HUD stats areound the player's ship. */
    ctx.save()
    let x = player.pos[0];
    let y = player.pos[1];
    ctx.translate(x,y);
    if (invincibility === true)
    {
        ctx.font = "10px Arial";
        ctx.fillStyle = "blue";
        ctx.textAlign = "center";
        ctx.fillText("INVINCIBILITY ACTIVE", 0, -40);
        ctx.fillText("GET TO A SAFE SPOT!", 0, -30);
    }
    if (keysDown.f && lEnergyRestorationTriggered)
    {
        ctx.font = "10px Arial";
        ctx.fillStyle = "red";
        ctx.textAlign = "center";
        ctx.fillText("LASER POWER LOW", 0, 36);
    }
    if (keysDown.r && player.numMissiles === 0)
    {
        ctx.font = "10px Arial";
        ctx.fillStyle = "red";
        ctx.textAlign = "center";
        ctx.fillText("OUT OF MISSILES", 0, 46);
    }
    if (player.lEnergy < 100 || showLEnergyLevel)
    {
        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.moveTo(-15, 20);
        ctx.lineTo((-15 + 30*Math.max(0,player.lEnergy/100)), 20);
        ctx.stroke();
    }
    ctx.restore();
}

function gameOver()
{
    /* This controls what happens when the player gets destroyed with
    no ships left. */
    paused = false;
    inmenu = true;
    messages = [];
    lgTriggered = false;
    level = 0;
}

// MESSAGE GENERATION
function newMessage(message, pos, style, color, alignment, decay, fading)
{
    /* Generates a new message. The "fading" parameter controls whether the message
    times out. If it's set to "true", the message will time out, but if it's set to
    "false" the message will continue displaying. */
    var nm = {
        contents: message,
        pos: pos,
        style: style,
        color: color,
        alignment: alignment,
        decay: decay,
        fading: fading
    }
    messages.push(nm);
}

function drawMessages(messages)
{
    var mesNum = messages.length;
    if (mesNum > 0)
    {
        for (e = 0; e < mesNum; e++)
        {
            if (messages[e].decay <= 0)
            {
                messages.splice(e,1);
                e--;
            }
            else
            {
                if (messages[e].fading)
                {
                    messages[e].decay -= 0.1;
                }
                ctx.save();
                ctx.font = messages[e].style;
                ctx.fillStyle = messages[e].color;
                ctx.textAlign = messages[e].alignment;
                ctx.fillText(messages[e].contents, messages[e].pos[0], messages[e].pos[1]);
                ctx.restore;
            }
            mesNum = messages.length;
        }
    }
}

// MENUS
function menuControl()
{
    /* This function displays the menus for the game. There are two menus:
    The first for when the player is new, and the second for when the player
    has played through one game - i.e. the "Game Over" screen with high scores. */
    if (inmenu)
    {
        drawParticles(particles);
        if (gameNum === 0)
        {
            // Clears all current messages:
            messages = [];

            // Heading
            let mtext = 'The Space Force';
            newMessage(mtext, [sizeX/2, sizeY*0.25], "90px Trebuchet MS", "lightgrey", "center", 1, false);
            mtext = 'Pilot your ship. Shoot meteors. Explode. Welcome to The Space Force, Cadet!';
            newMessage(mtext, [sizeX/2, sizeY*0.30], "18px Trebuchet MS", "lightgrey", "center", 1, false);
            mtext = 'Hit ENTER to begin!';
            newMessage(mtext, [sizeX/2, sizeY*0.39], "36px Segoe UI", "lightgrey", "center", 1, false);
            mtext = "Click on the game area if the controls aren't working.";
            newMessage(mtext, [sizeX/2, sizeY*0.415], "12px Segoe UI", "lightgrey", "center", 1, false);

            // Tips - can be moved by adjusting tipx and tipy.
            let tipx = sizeX/3.2;
            let tipy = sizeY*0.50;
            let tipfont1 = "16px Segoe UI";
            let tipfont2 = "bold 16px Segoe UI";
            newMessage('TIPS', [tipx, tipy], "36px Verdana", "lightgrey", "left", 1, false);
            newMessage('Knowledge is the key to victory!', [tipx, tipy + sizeY*0.02], "10px Verdana", "lightgrey", "left", 1, false);
            mtext = " - Disruptors have a slow rate of fire, but make up for it with range.";
            newMessage(mtext, [tipx, tipy + sizeY*0.050], tipfont1, "lightgrey", "left", 1, false);
            mtext = " - Lasers are incredibly powerful, but consume a lot of energy. Use in emergencies.";
            newMessage(mtext, [tipx, tipy + sizeY*0.075], tipfont1, "lightgrey", "left", 1, false);
            mtext = " - If you can't see any asteroids, look near the edges of the screen for helpful aiming dots.";
            newMessage(mtext, [tipx, tipy + sizeY*0.100], tipfont1, "lightgrey", "left", 1, false);
            mtext = " - You get an extra ship for each level you beat. They're really expensive, so try not to crash yours!";
            newMessage(mtext, [tipx, tipy + sizeY*0.125], tipfont1, "lightgrey", "left", 1, false);
            mtext = " - Missiles are powerful and have a guidance system. They will lock on to a target based on its priority.";
            newMessage(mtext, [tipx, tipy + sizeY*0.150], tipfont1, "lightgrey", "left", 1, false);
            mtext = "    This might not be the same as your priority. You get 4 of them per level and your ship can carry up to 24.";
            newMessage(mtext, [tipx, tipy + sizeY*0.175], tipfont1, "lightgrey", "left", 1, false);
            mtext = " - Aim for the stars! In real life, I mean.";
            newMessage(mtext, [tipx, tipy + sizeY*0.200], tipfont1, "lightgrey", "left", 1, false);


            // Controls - can be moved by adjusting posx and posy.
            let posx = sizeX/3.2;
            let posy = sizeY*0.78;
            let font1 = "18px Segoe UI";
            let font2 = "bold 18px Segoe UI";
            newMessage('CONTROLS', [posx, posy], "36px Verdana", "lightgrey", "left", 1, false);
            newMessage('Know your ship! Train hard, fight easy!', [posx, posy + sizeY*0.02], "10px Verdana", "lightgrey", "left", 1, false);
            newMessage('Accelerate:', [posx, posy + sizeY*0.06], font1, "lightgrey", "left", 1, false);
            newMessage('W or \u2191', [posx + 150, posy + sizeY*0.06], font2, "lightgrey", "left", 1, false);
            newMessage('Rotate Left:', [posx, posy + sizeY*0.09], font1, "lightgrey", "left", 1, false);
            newMessage('A or \u2190', [posx + 150, posy + sizeY*0.09], font2, "lightgrey", "left", 1, false);
            newMessage('Rotate Right:', [posx, posy + sizeY*0.12], font1, "lightgrey", "left", 1, false);
            newMessage('D or \u2192', [posx + 150, posy + sizeY*0.12], font2, "lightgrey", "left", 1, false);
            newMessage('Fire Disruptors:', [1.5*posx, posy + sizeY*0.06], font1, "lightgrey", "left", 1, false);
            newMessage('SPACE', [1.5*posx + 150, posy + sizeY*0.06], font2, "lightgrey", "left", 1, false);
            newMessage('Fire Lasers:', [1.5*posx, posy + sizeY*0.09], font1, "lightgrey", "left", 1, false);
            newMessage('F', [1.5*posx + 150, posy + sizeY*0.09], font2, "lightgrey", "left", 1, false);
            newMessage('Fire Missile:', [1.5*posx, posy + sizeY*0.12], font1, "lightgrey", "left", 1, false);
            newMessage('R', [1.5*posx + 150, posy + sizeY*0.12], font2, "lightgrey", "left", 1, false);
            
            // Author Footnote
            mtext = 'ver. 1.0 : 03 May 2018'
            newMessage(mtext, [sizeX-5, sizeY-20], "10px Verdana", "lightgrey", "right", 1, false);
            mtext = 'A game by Michael Elmore \u00A9 2018'
            newMessage(mtext, [sizeX-5, sizeY-6], "10px Verdana", "lightgrey", "right", 1, false);
        }
        else
        {
            let mtext = "";

            // Clears all current messages:
            messages = [];

            // Game Score
            mtext = parseInt(score)
            newMessage(mtext, [sizeX/2, sizeY*0.27], "250px Verdana", "#151515", "center", 1, false);

            // Heading
            mtext = 'The Space Force';
            newMessage(mtext, [sizeX/2, sizeY*0.15], "90px Trebuchet MS", "lightgrey", "center", 1, false);
            mtext = 'Pilot your ship. Shoot meteors. Explode. Welcome to The Space Force, Cadet!';
            newMessage(mtext, [sizeX/2, sizeY*0.20], "18px Trebuchet MS", "lightgrey", "center", 1, false);
            mtext = 'Game Over. Your score: ' + score.toLocaleString() + '.';
            newMessage(mtext, [sizeX/2, sizeY*0.26], "38px Segoe UI", "lightgrey", "center", 1, false);
            mtext = 'You can do better than this. Hit ENTER to try again!';
            newMessage(mtext, [sizeX/2, sizeY*0.95], "36px Segoe UI", "lightgrey", "center", 1, false);

            // Line
            ctx.beginPath();
            ctx.strokeStyle = "lightgrey";
            ctx.moveTo(sizeX/6,sizeY*0.31);
            ctx.lineTo(5*sizeX/6,sizeY*0.31);
            ctx.stroke();
            ctx.moveTo(sizeX/6,sizeY*0.88);
            ctx.lineTo(5*sizeX/6,sizeY*0.88);
            ctx.stroke();
            ctx.restore;

            // High Scores
            mtext = "Wall of Fame"
            newMessage(mtext, [sizeX/2, sizeY*0.39], "bold 48px Segoe UI", "lightgrey", "center", 1, false);
            mtext = "High scores system to be implemented."
            newMessage(mtext, [sizeX/2, sizeY*0.42], "12px Segoe UI", "lightgrey", "center", 1, false);

            var posx = sizeX/6 + 35;
            var posy = sizeY* 0.47;
            var font1 = "bold 14px Segoe UI";
            var font2 = "14px Segoe UI"
            var rank = 1;
            for (i = 0; i < 4; i++)
            {
                for (j = 0; j < 15; j++)
                {
                    let pos1x = posx + i*(sizeX/6);
                    let pos1y = posy + j*(sizeY*0.025);
                    let hiscore = 11242 - 41*j - 410*i;
                    newMessage(rank, [pos1x, pos1y], font1, "white", "right", 1, false);
                    newMessage("Player Name", [pos1x + 8, pos1y], font2, "lightgrey", "left", 1, false);
                    newMessage(hiscore.toLocaleString(), [pos1x + sizeX*0.09, pos1y], font2, "lightgrey", "left", 1, false);
                    rank++;
                }
            }
            
            // Author Footnote
            mtext = 'ver. 1.0 : 03 May 2018'
            newMessage(mtext, [sizeX-5, sizeY-20], "10px Verdana", "lightgrey", "right", 1, false);
            mtext = 'A game by Michael Elmore \u00A9 2018'
            newMessage(mtext, [sizeX-5, sizeY-6], "10px Verdana", "lightgrey", "right", 1, false);
        }
        if (!music)
        {
            ctx.font = "10px Verdana";
            ctx.fillStyle = "lightgrey";
            ctx.textAlign = "left";
            ctx.fillText('Press "M" to play cool space music!', 5, sizeY-6);
        }
        else if (music)
        {
            ctx.font = "10px Verdana";
            ctx.fillStyle = "lightgrey";
            ctx.textAlign = "left";
            ctx.fillText('Press "M" to stop music.', 5, sizeY-6);
        }
    }
}

// The gameplay animation function.
function animate()
{
    // 1. Clear Canvas, draw Stars
    ctx.clearRect(0,0, canvas.width, canvas.height);
    drawStars();

    // 2. Refresh Stats
    gameMech();
    menuControl();

    // 3. Draw objects
    if (!inmenu)
    {
        drawDShots();
        drawLShots();
        drawAsteroids();
        drawParticles(particles);
        drawObject(player);
        drawMissiles();
        drawStats();
    }
    genSpaceDust();

    drawMessages(messages);

    // 4. Move objects
    if (!(paused || inmenu))
    {
        controlPlayer();
        controlMissiles();
        movePlayer(player);
        moveDShots();
        moveLShots();
        moveMissiles();
        moveAsteroids();
    }
    moveParticles(particles);

    // 5. Detect Collisions
    collisionsAsteroids();

    // 6. Cleanup
    cleanupAsteroids();

    // 7. Call Request Animation Frame
    requestAnimationFrame(animate)
}