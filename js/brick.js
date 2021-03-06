// brick.js create by keiboard learn from learnopengl.
// const texturesDir = "./textures"

var textureResources = {
    background: loadTexture(gl.TEXTURE0, "./textures/background.jpg"),
    block_solid: loadTexture(gl.TEXTURE0, "./textures/block_solid.png"),
    block: loadTexture(gl.TEXTURE0, "./textures/block.png"),
    awesomeface: loadTexture(gl.TEXTURE0, "./textures/awesomeface.png"),
    paddle: loadTexture(gl.TEXTURE0, "./textures/paddle.png"),
}

function GetResources() {
    
    var VAO = createVertexArray()
    var VBO = gl.createBuffer()
    const vertices = [
        // 位置     // 纹理
        0.0, 1.0, 0.0, 1.0,
        1.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 0.0,

        0.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 0.0, 1.0, 0.0
    ];
    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    bindVertexArray(VAO)
    
    const layout = 0
    gl.enableVertexAttribArray(layout);
    gl.vertexAttribPointer(layout, 4, gl.FLOAT, false, 0, 0);
    
    bindVertexArray(null)

    var FBO = gl.createFramebuffer()
    

    var TBO = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, TBO)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

    var RBO = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, RBO)
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, canvas.width, canvas.height)

    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, TBO, 0)
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, RBO)
    
    /*if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE)
        console.log("FBO complete.")*/
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    return [VAO, VBO, FBO, TBO, RBO]
}

var [VAO, VBO, FBO, TBO, RBO] = GetResources()


const brickLevel1 =
    `5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 	 
    5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 	 
    4 4 4 4 4 0 0 0 0 0 4 4 4 4 4 	 
    4 1 4 1 4 0 0 1 0 0 4 1 4 1 4 	 
    3 3 3 3 3 0 0 0 0 0 3 3 3 3 3 	 
    3 3 1 3 3 3 3 3 3 3 3 3 1 3 3 	 
    2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 	 
    2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 `

const GameState = {
    GAME_ACTIVE: 0,
    GAME_MENU: 1,
    GAME_WIN: 2
}

const Direction = {
    UP: 0,
    RIGHT: 1, 
    DOWN: 2,
    LEFT: 3,
    LEFT_UP: 4,
    LEFT_DOWN: 5,
    RIGHT_DOWN: 6,
    RIGHT_UP: 7
}

const Compass = [
    vec2.fromValues(0.0, 1.0),
    vec2.fromValues(1.0, 0.0),
    vec2.fromValues(0.0, -1.0),
    vec2.fromValues(-1.0, 0.0),
    vec2.fromValues(-1.0, 1.0),
    vec2.fromValues(1.0, 1.0),
    vec2.fromValues(1.0, -1.0),
    vec2.fromValues(-1.0, -1.0)
]

class Game {
    constructor(width, height) {
        this.width = width
        this.height = height
        this.state = -1
        //this.keys = Array(1024)
        this.levels = Array()
        this.level = 1
        //this.background

    }

    init() {}
    processInput() {}
    update() {}
    render() {}
}

class GameLevel {
    constructor(width, height, tileFile) {
        this.levelWidth = width
        this.levelHeight = height
        this.tileFile = tileFile

        this.bricks = Array()
        this.background
        this.paddle
        this.ball

        this.velocityInit = width / 60
    }
    init() {}
    initBrick() {}
    doCollisions(oldPosition) {}
    draw() {}
    isCompleted() {}
}

class GameObject {
    constructor(textureBuffer, position, size, color) {
        this.destroyed = false

        this.position = position
        this.size = size
        this.color = color

        this.VAO = VAO
        this.textureBuffer = textureBuffer
    }
    init() {}
    draw() {}
}

function vectorDirection(target, compassIndex) {

    var max = 0.0
    var best_match = -1

    for (var i = compassIndex; i < compassIndex+4; ++i) {
        var dot_product = vec2.dot(vec2.normalize(target, target), Compass[i])
        
        if (dot_product > max) {
            max = dot_product
            best_match = i
        }
    }
    return best_match
}

const clamp = (min, max, n) => Math.max(min, Math.min(max, n))

function checkCollision(ball, obj, oldPosition) {
    var center = vec2.fromValues(ball.position[0] + ball.size[0]/2, ball.position[1] + ball.size[1]/2)
    var aabb_half_extents = vec2.fromValues(obj.size[0] / 2, obj.size[1] / 2)
    var aabb_center = vec2.create()
    vec2.add(aabb_center, obj.position, aabb_half_extents)

    var distance = vec2.create()
    vec2.subtract(distance, center, aabb_center)

    var clamped = vec2.fromValues(
        clamp(-aabb_half_extents[0], aabb_half_extents[0], distance[0]),
        clamp(-aabb_half_extents[1], aabb_half_extents[1], distance[1]))

    var closest = vec2.create()
    vec2.add(closest, aabb_center, clamped)

    vec2.subtract(distance, closest, center)

    var result = vec2.length(distance) < ball.radius
    if (result) {
        var difference = vec2.create()
        vec2.subtract(difference, ball.position, oldPosition)
        return [result, distance, difference]
    }
    else
        return result
}

GameObject.prototype.init =
    function () {

    }

GameObject.prototype.draw =
    function () {
        //gl.useProgram(this.Program)
        var model = mat4.create()

        var position = this.position
        var rotate = this.rotate
        var size = this.size
        var color = this.color

        mat4.translate(model, model, vec3.fromValues(position[0], position[1], 0.0));
        //mat4.translate(model, model, vec3.fromValues(0.5 * size[0], 0.5 * size[1], 0.0));
        //mat4.rotate(model, model, rotate, vec3.fromValues(0.0, 0.0, 1.0));
        //mat4.translate(model, model, vec3.fromValues(-0.5 * size[0], -0.5 * size[1], 0.0));

        mat4.scale(model, model, vec3.fromValues(size[0], size[1], 1.0));

        gl.uniformMatrix4fv(gl.getUniformLocation(Program, "model"), false, model);
        gl.uniform3fv(gl.getUniformLocation(Program, "objColor"), color);

        bindVertexArray(this.VAO)
        //gl.activeTexture(gl.TEXTURE0); //设置使用的纹理编号-
        gl.bindTexture(gl.TEXTURE_2D, this.textureBuffer);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.bindTexture(gl.TEXTURE_2D, null);
        bindVertexArray(null)
    }

GameLevel.prototype.init =
    function () {
        gl.uniform1i(gl.getUniformLocation(Program, "scene"), 0);
        
        var projection = mat4.create()
        mat4.ortho(projection, 0.0, this.levelWidth, this.levelHeight, 0.0, -1.0, 1.0);
        gl.uniformMatrix4fv(gl.getUniformLocation(Program, "projection"), false, projection);

        var offset = 1.0 / 300.0
        var offsets = [
            [-offset, 0.0, offset, -offset, 0.0, offset, -offset, 0.0, offset],    // bottom-right    
            [offset, offset, offset, 0.0, 0.0, 0.0, -offset, -offset, -offset]
        ];
        gl.uniform2fv(gl.getUniformLocation(Program, "offsets"), offsets);

        var edge_kernel = [
            -1, -1, -1,
            -1,  8, -1,
            -1, -1, -1
        ];
        gl.uniform1fv(gl.getUniformLocation(Program, "edge_kernel"), edge_kernel);

        var blur_kernel = [
            1.0 / 16, 2.0 / 16, 1.0 / 16,
            2.0 / 16, 4.0 / 16, 2.0 / 16,
            1.0 / 16, 2.0 / 16, 1.0 / 16
        ];
        gl.uniform1fv(gl.getUniformLocation(Program, "blur_kernel"), blur_kernel);

        this.background = new GameObject(textureResources.background,
            vec2.fromValues(0, 0), vec3.fromValues(this.levelWidth, this.levelHeight), vec3.fromValues(1, 1, 1))

        this.paddle = new GameObject(textureResources.paddle,
            vec2.fromValues(0.45 * this.levelWidth, 0.97 * this.levelHeight),
            vec3.fromValues(0.10 * this.levelWidth, 0.03 * this.levelHeight), vec3.fromValues(1, 1, 1))

        this.paddle.velocity = this.levelWidth / 60

        var size = 0.04 * (this.levelHeight)
        this.ball = new GameObject(textureResources.awesomeface,
            vec2.fromValues((this.levelWidth - size) / 2 , 0.97 * this.levelHeight - size),
            vec3.fromValues(size, size), vec3.fromValues(1, 1, 1))

        this.ball.velocity = [0, this.levelHeight / 60]
        this.ball.direction = [1, 1]
        this.ball.radius = 0.9 * size /2

        this.bricks = Array()
        var tileData = Array()
        this.tileFile.split('\n').forEach(element => {
            temp = element.split(' ').filter(e => {
                return e && e.trim()
            })
            tileData.push(temp)
        })
        if (tileData.length > 0) {
            this.initBrick(tileData)
        }
    }

GameLevel.prototype.initBrick =
    function (tileData) {
        var heightNum = tileData.length
        var widthNum = tileData[0].length

        var height = this.levelHeight / heightNum / 2
        var width = this.levelWidth / widthNum

        for (var y = 0; y < heightNum; ++y) {
            for (var x = 0; x < widthNum; ++x) {

                var pos = vec2.fromValues(width * x, height * y)
                var size = vec2.fromValues(width, height)
                var color

                if (tileData[y][x] == 1) {
                    color = vec3.fromValues(0.8, 0.8, 0.7)
                    var obj = new GameObject(textureResources.block_solid, pos, size, color)
                    obj.isSolid = true
                    this.bricks.push(obj)
                } else if (tileData[y][x] > 1) {
                    if (tileData[y][x] == 2)
                        color = vec3.fromValues(0.2, 0.6, 1.0)
                    else if (tileData[y][x] == 3)
                        color = vec3.fromValues(0.0, 0.7, 0.0);
                    else if (tileData[y][x] == 4)
                        color = vec3.fromValues(0.8, 0.8, 0.4);
                    else if (tileData[y][x] == 5)
                        color = vec3.fromValues(1.0, 0.5, 0.0);

                    var obj = new GameObject(textureResources.block, pos, size, color)
                    obj.isSolid = false
                    this.bricks.push(obj)
                }
            }
        }

    }

GameLevel.prototype.doCollisions =
    function (oldPosition) {
        this.bricks.forEach(brick => {
            if (!brick.destroyed) {
                var collision = checkCollision(this.ball, brick, oldPosition)
                if (collision[0]) {
                    if (!brick.isSolid) {
                        brick.destroyed = true
                    }
                    else {
                        this.time = 3*deltaTime
                        gl.uniform1f(gl.getUniformLocation(Program, "time"), this.time)
                        //gl.uniform1i(gl.getUniformLocation(Program, "chaos"), 1)
                        gl.uniform1i(gl.getUniformLocation(Program, "shake"), 1)
                    }
                    var coll_vector = collision[1]
                    var coll_face = vectorDirection(collision[1], 0)

                    if (coll_face == Direction.LEFT || coll_face == Direction.RIGHT) {
                        var t = this.ball.direction[0] *= -1
                        this.ball.position[0] -= t*(this.ball.radius-Math.abs(coll_vector[0]))
                    }
                    else { 
                        var t = this.ball.direction[1] *= -1
                        this.ball.position[1] -= t*(this.ball.radius-Math.abs(coll_vector[1]))
                    }              
                }
            }
        })

        var collision = checkCollision(this.ball, this.paddle, oldPosition)
        if (!stuck && collision[0]) {
            var t = this.ball.direction[1] *= -1
            var coll_vector = collision[1]
            this.ball.position[1] -= t*(this.ball.radius-Math.abs(coll_vector[1]))

            var centerBoard = this.paddle.position[0] + this.paddle.size[0] / 2
            var centerBall = this.ball.position[0] + this.ball.size[0] / 2
            var distance =  centerBall - centerBoard
            var percentage = distance / (this.paddle.size[0] / 2)

            var radian = Math.PI / 3 * percentage
            var velocity = vec2.length(this.ball.velocity)

            //var move_vector = collision[2]
            //var move_face = vectorDirection(move_vector, 4)
            
            //var coll_vector = collision[1]
            //var coll_face = vectorDirection(collision[1], 0)

            this.ball.direction[0] = -1

            this.ball.velocity[0] = velocity * Math.sin(radian)
            this.ball.velocity[1] = velocity * Math.cos(radian)
            //console.log(this.ball.velocity)

        }
    }

GameLevel.prototype.update =
    function () {
        var level = this
        var paddle = this.paddle

        if (direction != 0) {
            paddle.position[0] += paddle.velocity * direction
            if (paddle.position[0] < -paddle.size[0])
                paddle.position[0] += level.levelWidth + paddle.size[0]
            else if (paddle.position[0] > level.levelWidth)
                paddle.position[0] -= level.levelWidth + paddle.size[0]
        }

        var ball = this.ball
        var oldPosition = ball.position.slice()
        if (stuck) {
            ball.position[0] = paddle.position[0] + paddle.size[0] / 2 - ball.size[0] / 2
        }
        else {
            ball.position[0] -= ball.direction[0] * ball.velocity[0]
            ball.position[1] -= ball.direction[1] * ball.velocity[1]

            if (ball.position[0] <= 0 || ball.position[0] >= level.levelWidth - 2 * ball.radius)
                ball.direction[0] *= -1
            if (ball.position[1] < 0) //|| ball.position[1] > level.levelHeight-paddle.size[1]-2*ball.radius) 
                ball.direction[1] *= -1
            else if (ball.position[1] > level.levelHeight) {
                stuck = true
                this.init()
            }

        }

        this.doCollisions(oldPosition)

        if(this.time > 0.0){
            this.time -= deltaTime
            if(this.time <= 0.0)
                gl.uniform1i(gl.getUniformLocation(Program, "shake"), 0);
        }
    }

GameLevel.prototype.draw =
    function () {
        this.background.draw()
        this.paddle.draw()
        this.ball.draw()

        this.bricks.forEach(obj => {
            if (!obj.destroyed) {
                obj.draw()
            }
        })
    }

Game.prototype.init =
    function () {
        //this.textureBuffer = loadTexture(gl, gl.TEXTURE0, "./textures/awesomeface.png")

        //const fileUrl = "./textures/awesomeface.png"
        Program = initShaderProgram(gl, vsSource, fsSource);
        gl.useProgram(Program);

        var one = new GameLevel(this.width, this.height, brickLevel1)
        one.init()
        this.levels.push(one)
    }

Game.prototype.render =
    function () {
        this.levels[this.level - 1].draw()
    }

Game.prototype.processInput =
    function () {
        direction = 0
        stuck = true

        document.addEventListener('keydown', (event)=>{
            var e = event || window.event || arguments.callee.caller.arguments[0]
            if (e && e.key == "ArrowLeft")
                direction = -1
            else if (e && e.key == "ArrowRight") 
                direction = 1
            else if (e && e.key == " ")
                stuck = false
        })
        document.addEventListener("keyup", (event) =>{
            direction = 0
        })
        var touch
        document.addEventListener('touchstart', (event)=>{
            event.preventDefault()
            if (event.touches[1] == null)
                touch = event.touches[0]
            else
                touch = event.touches[1]
            var key
            if (touch.pageX  < canvas.width/2)
                key = "ArrowLeft"
            else
                key = "ArrowRight"
            var e = new KeyboardEvent("keydown", {key: key})
            document.dispatchEvent(e)
        })
        document.addEventListener("touchmove", (event) =>{
            event.preventDefault()
            
            var key
            if (touch.pageX  < canvas.width/2)
                key = "ArrowLeft"
            else
                key = "ArrowRight"
            var e = new KeyboardEvent("keydown", {key: key})
            document.dispatchEvent(e)
        })

        document.addEventListener("touchend", (event) =>{
            if (event.touches[0] != null) {
                touch = event.touches[0]
                return
            }
            
            stuck = false
            direction = 0
        })

    }

Game.prototype.update =
    function () {
        this.levels[this.level - 1].update()
    }

function main() {

    game = new Game(canvas.width, canvas.height)

    game.init()
    game.processInput()

    gl.enable(gl.CULL_FACE)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    var then = 0

    function render(now) {
        now *= 0.001; // convert to seconds
        deltaTime = now - then;
        then = now;

        gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        gl.clearDepth(1.0); // Clear everything

        // Clear the canvas before we start drawing on it.

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        game.update()
        game.render()

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

window.onbeforeunload = ()=>{
    //gl.useProgram(null)
    //gl.deleteProgram(Program)
    for (name in textureResources) {
        gl.deleteTexture(textureResources[name])
    }
    gl.deleteBuffer(VBO)
    deleteVertexArray(VAO)
    gl.deleteRenderbuffer(RBO)
    gl.deleteTexture(TBO)
    gl.deleteFramebuffer(FBO)
    gl.getExtension('WEBGL_lose_context').loseContext()
}

main()
