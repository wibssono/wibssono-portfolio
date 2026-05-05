/************************
***** DECLARATIONS: *****
************************/
let cvs         //  canvas
let ctx         //  context'2d'
let description //  game description
let theme1      //  original theme
let theme2      //  original them v2
let bg          //  background
let bird        //  bird: yellow
let bird1       //  bird: red
let bird2       //  bird: blue
let pipes       //  top and bottom pipes
let ground      //  ground floor
let getReady    //  get ready screen
let gameOver    //  game over screen
let map         //  map of number images
let score       //  score counter
let gameState   //  state of game
let frame       //  ms/frame = 17; dx/frame = 2; fps = 59;
let degree      //  bird rotation degree
let presentsObj //  presents logic
const SFX_SCORE = new Audio()         //  sound for scoring
const SFX_JINGLE = new Audio()        //  sound for presents
const SFX_FLAP = new Audio()          //  sound for flying bird
const SFX_COLLISION = new Audio()     //  sound for collision
const SFX_FALL = new Audio()          //  sound for falling to the ground
const SFX_SWOOSH = new Audio()        //  sound for changing game state

cvs = document.getElementById('game')
ctx = cvs.getContext('2d')
description = document.getElementById('description')
theme1 = new Image()
theme1.src = 'img/og-theme.png'
theme2 = new Image()
theme2.src = 'img/og-theme-2.png'
frame = 0;
degree = Math.PI / 180
SFX_SCORE.src = 'audio/sfx_point.wav'
SFX_FLAP.src = 'audio/sfx_wing.wav'
SFX_COLLISION.src = 'audio/sfx_hit.wav'
SFX_FALL.src = 'audio/sfx_die.wav'
SFX_SWOOSH.src = 'audio/sfx_swooshing.wav'
SFX_JINGLE.src = 'audio/jinglebells.mp3'

gameState = {
    //loads game on ready screen, tick to change state of game
    current: 0,
    getReady: 0,
    //on play game state: bird flaps and flies
    play: 1,
    //game over screen: button||click takes player to ready screen
    gameOver: 2,
    popup: 3
}
//background
bg = {
    //object's key-value properties pinpointing its location
    imgX: 0,
    imgY: 0,
    width: 276,
    height: 228,
    //x,y coordinates of where image should be drawn on canvas
    x: 0,
    //https://stackoverflow.com/questions/7043509/this-inside-object
    //reason why 'y' cannot be defined as this.height or bg.height
    y: cvs.height - 228,
    w: 276,
    h: 228,
    dx: .2,
    //object's render function that utilizes all above values to draw image onto canvas
    render: function () {
        ctx.drawImage(theme1, this.imgX, this.imgY, this.width, this.height, this.x, this.y, this.w, this.h)

        //image repeat and tile to fit canvas
        ctx.drawImage(theme1, this.imgX, this.imgY, this.width, this.height, this.x + this.width, this.y, this.w, this.h)

        //image repeat again for continuous animation
        ctx.drawImage(theme1, this.imgX, this.imgY, this.width, this.height, this.x + this.width * 2, this.y, this.w, this.h)
    },

    position: function () {
        //still img on get ready frame
        if (gameState.current == gameState.getReady) {
            this.x = 0
        }
        //ANIMATION: slowly move background on play game state by decrementing x
        if (gameState.current == gameState.play) {
            this.x = (this.x - this.dx) % (this.w)
        }
    }
}
//top and bottom pipes
pipes = {
    //object's key-value properties pinpointing its location
    //top pipe image x,y coordinate
    top: {
        imgX: 56,
        imgY: 323,
    },
    //bot pipe image x,y coordinate
    bot: {
        imgX: 84,
        imgY: 323,
    },
    width: 26,
    height: 160,
    //pipes' values for drawing on canvas
    w: 55,
    h: 300,
    gap: 120,
    dx: 2,
    //acceptable y values must be -260 <= y <= -40
    minY: -260,
    maxY: -40,

    pipeGenerator: [],
    pipeCount: 0,

    reset: function () {
        this.pipeGenerator = []
        this.pipeCount = 0
    },
    //object's render function that utilizes all above values to draw image onto canvas
    render: function () {
        //draw whatever is in the pipeGenerator
        for (let i = 0; i < this.pipeGenerator.length; i++) {
            let pipe = this.pipeGenerator[i]
            let topPipe = pipe.y
            let bottomPipe = pipe.y + this.gap + this.h

            ctx.drawImage(theme2, this.top.imgX, this.top.imgY, this.width, this.height, pipe.x, topPipe, this.w, this.h)
            ctx.drawImage(theme2, this.bot.imgX, this.bot.imgY, this.width, this.height, pipe.x, bottomPipe, this.w, this.h)
        }
    },
    position: function () {
        //if game is not in session, do nothing
        if (gameState.current !== gameState.play) {
            return
        }
        //if game is in session, generate set of pipes forever
        if (gameState.current == gameState.play) {

            //when pipes reach this frame, generate another set
            if (frame % 100 == 0) {
                this.pipeGenerator.push(
                    {
                        //spawn off canvas
                        //pipes' x value needs to be width of canvas to render outside
                        x: cvs.width,
                        //random y-coordinates
                        //pipes' y value needs to vary randomly within acceptable parameters
                        y: Math.floor((Math.random() * (this.maxY - this.minY + 1)) + this.minY),
                        id: this.pipeCount
                    }
                )
                this.pipeCount++
            }
            //iterate for all pipes generated (animation, collision, deletion)
            for (let i = 0; i < this.pipeGenerator.length; i++) {

                //decleration for bird and pipes' parameters (COLLISION)
                let pg = this.pipeGenerator[i]
                let b = {
                    left: bird.x - bird.r,
                    right: bird.x + bird.r,
                    top: bird.y - bird.r,
                    bottom: bird.y + bird.r,
                }
                let p = {
                    top: {
                        top: pg.y,
                        bottom: pg.y + this.h
                    },
                    bot: {
                        top: pg.y + this.h + this.gap,
                        bottom: pg.y + this.h * 2 + this.gap
                    },
                    left: pg.x,
                    right: pg.x + this.w
                }

                //ANIMATION: set of pipes scroll from the right of canvas by decrementing x
                pg.x -= this.dx

                //delete pipes as they scroll off the canvas (memory management)
                if (pg.x < -this.w) {
                    this.pipeGenerator.shift()
                    //score up
                    score.current++
                    SFX_SCORE.play()
                }

                //PIPE COLLISION
                //collision with top pipe
                if (b.left < p.right &&
                    b.right > p.left &&
                    b.top < p.top.bottom &&
                    b.bottom > p.top.top) {
                    gameState.current = gameState.gameOver
                    SFX_COLLISION.play()
                }
                //collision with bottom pipe
                if (b.left < p.right &&
                    b.right > p.left &&
                    b.top < p.bot.bottom &&
                    b.bottom > p.bot.top) {
                    gameState.current = gameState.gameOver
                    SFX_COLLISION.play()
                }
            }
        }
    }
}
//ground floor
ground = {
    //object's key-value properties pinpointing its location
    imgX: 276,
    imgY: 0,
    width: 224,
    height: 112,
    //values for drawing on canvas
    x: 0,
    y: cvs.height - 112,
    w: 224,
    h: 112,
    dx: 2,
    render: function () {
        ctx.drawImage(theme1, this.imgX, this.imgY, this.width, this.height, this.x, this.y, this.w, this.h)
        //image repeat and tile to fit canvas
        ctx.drawImage(theme1, this.imgX, this.imgY, this.width, this.height, this.x + this.width, this.y, this.w, this.h)
    },
    //ANIMATION:  ground scrolls to the left in a continuous loop when game state is at play
    //needs to be at the same rate of pipes' scroll speed
    position: function () {
        if (gameState.current == gameState.getReady) {
            this.x = 0
        }
        if (gameState.current == gameState.play) {
            //modulus keeps this.x value infinitely cycling back to zero
            this.x = (this.x - this.dx) % (this.w / 2)
        }
    }
}
//map of number images
map = [
    num0 = {
        imgX: 496,
        imgY: 60,
        width: 12,
        height: 18
    },
    num1 = {
        imgX: 135,
        imgY: 455,
        width: 10,
        height: 18
    },
    num2 = {
        imgX: 292,
        imgY: 160,
        width: 12,
        height: 18
    },
    num3 = {
        imgX: 306,
        imgY: 160,
        width: 12,
        height: 18
    },
    num4 = {
        imgX: 320,
        imgY: 160,
        width: 12,
        height: 18
    },
    num5 = {
        imgX: 334,
        imgY: 160,
        width: 12,
        height: 18
    },
    num6 = {
        imgX: 292,
        imgY: 184,
        width: 12,
        height: 18
    },
    num7 = {
        imgX: 306,
        imgY: 184,
        width: 12,
        height: 18
    },
    num8 = {
        imgX: 320,
        imgY: 184,
        width: 12,
        height: 18
    },
    num9 = {
        imgX: 334,
        imgY: 184,
        width: 12,
        height: 18
    }
]
//current score, top score, tracker
score = {
    current: 0,
    best: null, // DO THIS STRETCH GOAL
    //values for drawing mapped numbers on canvas
    x: cvs.width / 2,
    y: 40,
    w: 15,
    h: 25,
    reset: function () {
        this.current = 0
    },
    //display the score
    render: function () {
        if (gameState.current == gameState.play ||
            gameState.current == gameState.gameOver) {
            //change current score number value to string value and access each place value
            let string = this.current.toString()
            let ones = string.charAt(string.length - 1)
            let tens = string.charAt(string.length - 2)
            let hundreds = string.charAt(string.length - 3)

            //if current score has thousands place value: the game is over
            if (this.current >= 1000) {
                gameState.current = gameState.gameOver

                //if current score has ones, tens, and hundreds place value only
            } else if (this.current >= 100) {
                ctx.drawImage(theme2, map[ones].imgX, map[ones].imgY, map[ones].width, map[ones].height, ((this.x - this.w / 2) + (this.w) + 3), this.y, this.w, this.h)

                ctx.drawImage(theme2, map[tens].imgX, map[tens].imgY, map[tens].width, map[tens].height, ((this.x - this.w / 2)), this.y, this.w, this.h)

                ctx.drawImage(theme2, map[hundreds].imgX, map[hundreds].imgY, map[hundreds].width, map[hundreds].height, ((this.x - this.w / 2) - (this.w) - 3), this.y, this.w, this.h)

                //if current score has ones and tens place value only
            } else if (this.current >= 10) {
                ctx.drawImage(theme2, map[ones].imgX, map[ones].imgY, map[ones].width, map[ones].height, ((this.x - this.w / 2) + (this.w / 2) + 3), this.y, this.w, this.h)

                ctx.drawImage(theme2, map[tens].imgX, map[tens].imgY, map[tens].width, map[tens].height, ((this.x - this.w / 2) - (this.w / 2) - 3), this.y, this.w, this.h)

                //if current score has ones place value only
            } else {
                ctx.drawImage(theme2, map[ones].imgX, map[ones].imgY, map[ones].width, map[ones].height, (this.x - this.w / 2), this.y, this.w, this.h)
            }
        }
    }
}
//bird : YELLOW BIRD
bird = {
    animation: [
        { imgX: 276, imgY: 114 },  //  position 0
        { imgX: 276, imgY: 140 },  //  position 1
        { imgX: 276, imgY: 166 },  //  position 2
        { imgX: 276, imgY: 140 }   //  position 1
    ],
    fr: 0,
    //object's key-value properties pinpointing its location
    width: 34,
    height: 24,
    //values for drawing on canvas
    x: 50,
    y: 160,
    w: 34,
    h: 24,
    //bird's radius
    r: 12,
    //how much the bird flies per flap()
    fly: 5.25,
    //gravity increments the velocity per frame
    gravity: .32,
    //velocity = pixels the bird will drop in a frame
    velocity: 0,
    //object's render function that utilizes all above values to draw image onto canvas
    render: function () {
        let bird = this.animation[this.fr]
        //save all previous setting
        ctx.save()
        //target center of bird
        ctx.translate(this.x, this.y)
        //rotate bird by degree
        ctx.rotate(this.rotation)
        ctx.drawImage(theme1, bird.imgX, bird.imgY, this.width, this.height, -this.w / 2, -this.h / 2, this.w, this.h)
        ctx.restore()
        //bird is centered on x,y position
        // ctx.drawImage(theme1, bird.imgX,bird.imgY,this.width,this.height, this.x-this.w/2,this.y-this.h/2,this.w,this.h)
    },
    //bird flies
    flap: function () {
        this.velocity = - this.fly
    },
    //function checks gameState and updates bird's position
    position: function () {
        if (gameState.current == gameState.getReady) {
            this.y = 160
            this.rotation = 0 * degree
            //bird animation changes every 20 frames
            if (frame % 20 == 0) {
                this.fr += 1
            }
            //when bird animation reaches its last value, reset animation
            if (this.fr > this.animation.length - 1) {
                this.fr = 0
            }

        } else {
            //bird animation changes every 4 frames
            if (frame % 4 == 0) {
                this.fr += 1
            }
            //when bird animation reaches its last value, reset animation
            if (this.fr > this.animation.length - 1) {
                this.fr = 0
            }

            //bird falls to gravity
            this.velocity += this.gravity
            this.y += this.velocity

            //bird rotation
            if (this.velocity <= this.fly) {
                this.rotation = -15 * degree
            } else if (this.velocity >= this.fly + 2) {
                this.rotation = 70 * degree
                this.fr = 1
            } else {
                this.rotation = 0
            }

            //check collision with ground
            if (this.y + this.h / 2 >= cvs.height - ground.h) {
                this.y = cvs.height - ground.h - this.h / 2
                //stop flapping when it hits the ground
                if (frame % 1 == 0) {
                    this.fr = 2
                    this.rotation = 70 * degree
                }
                //then the game is over
                if (gameState.current == gameState.play) {
                    gameState.current = gameState.gameOver
                    SFX_FALL.play()
                }
            }

            //bird cannot fly above canvas
            if (this.y - this.h / 2 <= 0) {
                this.y = this.r
            }

        }
    }
}
//bird1 : RED BIRD
bird1 = {
    //ANIMATION: bird  //DO THIS STRETCH GOAL
    animation: [
        { imgX: 115, imgY: 381 },  //  position 0
        { imgX: 115, imgY: 407 },  //  position 1
        { imgX: 115, imgY: 433 },  //  position 2
        { imgX: 115, imgY: 407 }   //  position 1
    ],
    fr: 0,
    //object's key-value properties pinpointing its location
    width: 18,
    height: 12,
    //values for drawing on canvas
    x: 50,
    y: 160,
    w: 34,
    h: 24,
    //bird's radius
    r: 12,
    //how much the bird flies per flap()
    fly: 5.25,
    //gravity increments the velocity per frame
    gravity: .32,
    //velocity = pixels the bird will drop in a frame
    velocity: 0,
    //object's render function that utilizes all above values to draw image onto canvas
    render: function () {
        let bird = this.animation[this.fr]
        //bird is centered on x,y position
        ctx.drawImage(theme2, bird.imgX, bird.imgY, this.width, this.height, this.x - this.w / 2, this.y - this.h / 2, this.w, this.h)
    },
    //bird flies
    flap: function () {
        this.velocity = - this.fly
    },
    //function checks gameState and updates bird's position
    position: function () {
        if (gameState.current == gameState.getReady) {
            this.y = 160
            //bird animation changes every 20 frames
            if (frame % 20 == 0) {
                this.fr += 1
            }
            //when bird animation reaches its last value, reset animation
            if (this.fr > this.animation.length - 1) {
                this.fr = 0
            }

        } else {
            //bird animation changes every 4 frames
            if (frame % 4 == 0) {
                this.fr += 1
            }
            //when bird animation reaches its last value, reset animation
            if (this.fr > this.animation.length - 1) {
                this.fr = 0
            }

            //bird falls to gravity
            this.velocity += this.gravity
            this.y += this.velocity

            //check collision with ground
            if (this.y + this.h / 2 >= cvs.height - ground.h) {
                this.y = cvs.height - ground.h - this.h / 2
                //stop flapping when it hits the ground
                if (frame % 1 == 0) {
                    this.fr = 2
                }
                //then the game is over
                if (gameState.current == gameState.play) {
                    gameState.current = gameState.gameOver
                    SFX_FALL.play()
                }
            }

            //bird cannot fly above canvas
            if (this.y - this.h / 2 <= 0) {
                this.y = this.r
            }
        }
    }
}
//bird2 : BLUE BIRD
bird2 = {
    //ANIMATION: bird  //DO THIS STRETCH GOAL
    animation: [
        { imgX: 87, imgY: 491 },   //  position 0
        { imgX: 115, imgY: 329 },  //  position 1
        { imgX: 115, imgY: 355 },  //  position 2
        { imgX: 115, imgY: 329 }   //  position 1
    ],
    fr: 0,
    //object's key-value properties pinpointing its location
    //ANIMATION: bird2  //DO THIS STRETCH GOAL
    imgX: 87,
    imgY: 491,
    width: 18,
    height: 12,
    //values for drawing on canvas
    x: 50,
    y: 160,
    w: 34,
    h: 24,
    //bird's radius
    r: 12,
    //how much the bird flies per flap()
    fly: 5.25,
    //gravity increments the velocity per frame
    gravity: .32,
    //velocity = pixels the bird will drop in a frame
    velocity: 0,
    //object's render function that utilizes all above values to draw image onto canvas
    render: function () {
        let bird = this.animation[this.fr]
        //bird is centered on x,y position
        ctx.drawImage(theme2, bird.imgX, bird.imgY, this.width, this.height, this.x - this.w / 2, this.y - this.h / 2, this.w, this.h)
    },
    //bird flies
    flap: function () {
        this.velocity = - this.fly
    },
    //function checks gameState and updates bird's position
    position: function () {
        if (gameState.current == gameState.getReady) {
            this.y = 160
            //bird animation changes every 20 frames
            if (frame % 20 == 0) {
                this.fr += 1
            }
            //when bird animation reaches its last value, reset animation
            if (this.fr > this.animation.length - 1) {
                this.fr = 0
            }

        } else {
            //bird animation changes every 4 frames
            if (frame % 4 == 0) {
                this.fr += 1
            }
            //when bird animation reaches its last value, reset animation
            if (this.fr > this.animation.length - 1) {
                this.fr = 0
            }

            //bird falls to gravity
            this.velocity += this.gravity
            this.y += this.velocity

            //check collision with ground
            if (this.y + this.h / 2 >= cvs.height - ground.h) {
                this.y = cvs.height - ground.h - this.h / 2
                //stop flapping when it hits the ground
                if (frame % 1 == 0) {
                    this.fr = 2
                }
                //then the game is over
                if (gameState.current == gameState.play) {
                    gameState.current = gameState.gameOver
                    SFX_FALL.play()
                }
            }

            //bird cannot fly above canvas
            if (this.y - this.h / 2 <= 0) {
                this.y = this.r
            }
        }
    }
}
//get ready screen
getReady = {
    //object's key-value properties pinpointing its location
    imgX: 0,
    imgY: 228,
    width: 174,
    height: 160,
    //values for drawing on canvas
    x: cvs.width / 2 - 174 / 2,
    y: cvs.height / 2 - 160,
    w: 174,
    h: 160,
    //object's render function that utilizes all above values to draw image onto canvas
    render: function () {
        //only draw this if the game state is on get ready
        if (gameState.current == gameState.getReady) {
            ctx.drawImage(theme1, this.imgX, this.imgY, this.width, this.height, this.x, this.y, this.w, this.h)
        }
    }
}
//game over screen
gameOver = {
    //object's key-value properties pinpointing its location
    imgX: 174,
    imgY: 228,
    width: 226,
    height: 158,
    //values for drawing on canvas
    x: cvs.width / 2 - 226 / 2,
    y: cvs.height / 2 - 160,
    w: 226,
    h: 160,
    //object's render function that utilizes all above values to draw image onto canvas
    render: function () {
        //only draw this if the game state is on game over
        if (gameState.current == gameState.gameOver) {
            ctx.drawImage(theme1, this.imgX, this.imgY, this.width, this.height, this.x, this.y, this.w, this.h)
            description.style.visibility = "visible"
        }
    }
}
presentsObj = {
    img: new Image(),
    bgEffectImg: new Image(),
    popups: [],
    collected: [false, false, false, false, false],
    activePopupId: -1,
    rotation: 0,
    rotationDir: 1,
    w: 30,
    h: 30,
    init: function () {
        this.img.src = 'img/present.png'
        this.bgEffectImg.src = 'img/bg_effect.png'
        for (let i = 1; i <= 5; i++) {
            let pImg = new Image()
            pImg.src = `img/present${i}.png`
            this.popups.push(pImg)
        }
    },
    render: function () {
        if (gameState.current === gameState.play) {
            this.rotation += this.rotationDir * 0.5;
            if (this.rotation >= 10) this.rotationDir = -1;
            if (this.rotation <= -10) this.rotationDir = 1;
        }

        if (gameState.current === gameState.popup && this.activePopupId >= 0 && this.activePopupId < 5) {
            // Darken background
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(0, 0, cvs.width, cvs.height);

            // Draw rotating background effect
            if (this.bgEffectImg.width) {
                ctx.save();
                ctx.translate(cvs.width / 2, cvs.height / 2);
                ctx.rotate(frame * 0.02);
                let scale = 1.5;
                ctx.drawImage(this.bgEffectImg, -cvs.width * scale / 2, -cvs.width * scale / 2, cvs.width * scale, cvs.width * scale);
                ctx.restore();
            }

            let pImg = this.popups[this.activePopupId];
            let drawW = cvs.width * 0.8;
            let drawH = cvs.height * 0.8;
            if (pImg.width && pImg.height) {
                let aspect = pImg.width / pImg.height;
                drawH = drawW / aspect;
                if (drawH > cvs.height * 0.8) {
                    drawH = cvs.height * 0.8;
                    drawW = drawH * aspect;
                }
            }

            // Bobbing animation offset
            let bobOffset = Math.sin(frame * 0.05) * 10;
            ctx.drawImage(pImg, cvs.width / 2 - drawW / 2, cvs.height / 2 - drawH / 2 + bobOffset, drawW, drawH);
            return;
        }

        for (let i = 0; i < pipes.pipeGenerator.length; i++) {
            let pg = pipes.pipeGenerator[i];
            let pId = pg.id;
            if (pId >= 0 && pId < 5 && !this.collected[pId]) {
                let px = pg.x + pipes.w / 2;
                let py = pg.y + pipes.h + pipes.gap / 2;

                ctx.save();
                ctx.translate(px, py);
                ctx.rotate(this.rotation * degree);
                ctx.drawImage(this.img, -this.w / 2, -this.h / 2, this.w, this.h);
                ctx.restore();
            }
        }
    },
    checkCollision: function () {
        if (gameState.current !== gameState.play) return;
        let b = {
            left: bird.x - bird.r,
            right: bird.x + bird.r,
            top: bird.y - bird.r,
            bottom: bird.y + bird.r,
        };

        for (let i = 0; i < pipes.pipeGenerator.length; i++) {
            let pg = pipes.pipeGenerator[i];
            let pId = pg.id;
            if (pId >= 0 && pId < 5 && !this.collected[pId]) {
                let px = pg.x + pipes.w / 2;
                let py = pg.y + pipes.h + pipes.gap / 2;
                let p = {
                    left: px - this.w / 2,
                    right: px + this.w / 2,
                    top: py - this.h / 2,
                    bottom: py + this.h / 2
                };
                if (b.left < p.right && b.right > p.left && b.top < p.bottom && b.bottom > p.top) {
                    this.collected[pId] = true;
                    this.activePopupId = pId;
                    gameState.current = gameState.popup;
                    SFX_JINGLE.play();
                }
            }
        }
    }
}
presentsObj.init();

/************************
***** FUNCTIONS: ********
************************/
//anything to be drawn on canvas goes in here
let draw = () => {
    //this clears canvas to default bg color
    ctx.fillStyle = '#00bbc4'
    ctx.fillRect(0, 0, cvs.width, cvs.height)
    //things to draw
    bg.render()
    pipes.render()
    ground.render()
    score.render()
    bird.render()
    getReady.render()
    gameOver.render()
    presentsObj.render()
}
//updates on animation and position goes in here
let update = () => {
    //things to update
    if (gameState.current === gameState.popup) return;

    bird.position()
    bg.position()
    pipes.position()
    ground.position()
    presentsObj.checkCollision()
}
//game looper
let loop = () => {
    draw()
    update()
    frame++
    //average of requestAnimationFrame is 50-60fps
    // requestAnimationFrame(loop)
}
loop()
setInterval(loop, 17)

/*************************
***** EVENT HANDLERS ***** 
*************************/
//on mouse click // tap screen
cvs.addEventListener('click', () => {
    if (gameState.current == gameState.popup) {
        pipes.reset()
        score.reset()
        gameState.current = gameState.getReady
        SFX_SWOOSH.play()
        return
    }
    //if ready screen >> go to play state
    if (gameState.current == gameState.getReady) {
        gameState.current = gameState.play
    }
    //if play state >> bird keeps flying
    if (gameState.current == gameState.play) {
        bird.flap()
        SFX_FLAP.play()
        description.style.visibility = "hidden"
    }
    //if game over screen >> go to ready screen
    if (gameState.current == gameState.gameOver) {
        pipes.reset()
        score.reset()
        gameState.current = gameState.getReady
        SFX_SWOOSH.play()
    }
})
//on spacebar
document.body.addEventListener('keydown', (e) => {
    //if ready screen >> go to play state
    if (e.keyCode == 32) {
        if (gameState.current == gameState.popup) {
            pipes.reset()
            score.reset()
            SFX_SWOOSH.play()
            gameState.current = gameState.getReady
            return
        }
        if (gameState.current == gameState.getReady) {
            gameState.current = gameState.play
        }
        //if play state >> bird keeps flying
        if (gameState.current == gameState.play) {
            bird.flap()
            SFX_FLAP.play()
            description.style.visibility = "hidden"
        }
        //if game over screen >> go to ready screen
        if (gameState.current == gameState.gameOver) {
            pipes.reset()
            score.reset()
            SFX_SWOOSH.play()
            gameState.current = gameState.getReady
        }
    }
})