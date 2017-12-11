/**
 * This game is about snake, which continuously moving into playing space.
 * To get scores you need to eat food, which appears at field.
 * If snake is beat itself or playing space border the game was over.
 * You may see scores table by click on button.
 * You may choose size of playing space between 300, 500, 700.
 *
 */

(function () {

    var BLOCK_SIZE = 20; // width/height of snake/food one block
    var DIRECTION_KEY = { //mapping keyboard code of arrow buttons on direction name
        37 : 'left',
        38 : 'up',
        39 : 'right',
        40 : 'down'
    };

    var loginForm = document.getElementById('login-form');
    var nameInput = document.getElementById('gamer-name');
    var gameContainer = document.getElementById('playing-container');
    var playingContainer = document.getElementById('playing-space');
    var playingContainerOverlay = document.getElementById('playing-space_overlay');
    var playButton = document.getElementById('play-btn');
    var playingScoreContainer = document.getElementById('playing-score-info');
    var sizeMenuContainer = document.getElementById('size-menu');
    var sizeMenuItems = sizeMenuContainer.children;
    var scoreTableButton = document.getElementById('scores-table-btn');
    var scoreTable = document.getElementById('scores-table');
    var playTimerId;

    var gamerName = 'Unknown';
    var maxPosition = 300; // width/height of game playing space

    var snake;
    var food;
    var foodCount;

    init(maxPosition); //sending param is initial size of playing space

    /**
     * Init variables and draw initial elements on scene
     *
     * @param size - playing space height/width size
     */
    function init(size) {
        maxPosition = size;
        foodCount = 0;

        var startLeft = maxPosition / 2 + 10;
        var startTop = maxPosition / 2 - 10;

        snake = [
            new FigureBlock(startLeft, startTop),
            new FigureBlock(startLeft - BLOCK_SIZE, startTop),
            new FigureBlock(startLeft - 2 * BLOCK_SIZE, startTop),
        ];

        playingContainer.innerHTML = "";
        for (var i = 0; i < snake.length; i++) {
            playingContainer.appendChild(snake[i].element);
        }

        // if food random coordinates same with one of the snack blocks, repeat drawing
        while (!drawFood());
    }

    sizeMenuContainer.addEventListener('click', function(e) {

        //check if game is not in progress and click on menu size item
        if(!playTimerId && e.target.classList.contains('size-menu_item')) {

            for (var i = 0; i < sizeMenuItems.length; i++) {
                sizeMenuItems[i].classList.remove('active');
            }
            e.target.classList.add('active');

            var containerSize = +e.target.getAttribute('data-size') + 40;
            gameContainer.style.cssText = "width: " + containerSize + "px; height: " + containerSize + "px;";

            init(+containerSize);
        }
    });

    scoreTableButton.addEventListener('click', function() {
        scoreTable.innerHTML = "";
        fetch('/players')
            .then(function(res) {
                return res.json();
            })
            .then(function(resJson) {

                var closeBtn = document.createElement('p')
                closeBtn.innerHTML = "close";
                closeBtn.style.cssText = "cursor:pointer; text-decoration:underline";
                closeBtn.addEventListener('click', function(){
                    scoreTable.style.cssText = "";
                });
                scoreTable.appendChild(closeBtn);

                for(var i=0; i < resJson.length; i++) {
                    var winnerRow = document.createElement('p')
                    winnerRow.innerHTML = "<p>" + resJson[i].name + "   :   " + resJson[i].score + "</p>";
                    scoreTable.appendChild(winnerRow);
                }
                scoreTable.style.cssText = "display:block;";
            });
    });

    playButton.addEventListener('click', function() {
        if (nameInput && nameInput.value) {
            gamerName = nameInput.value;
        }
        playingContainerOverlay.style.cssText = "display:none;";
        loginForm.style.cssText = "display:none;";
        window.addEventListener('keydown', onSnakeChangeDirection);

        play();
    });

    function onSnakeChangeDirection(e) {
        var newDirection = DIRECTION_KEY[e.keyCode];
        if (newDirection) {
            snake[0].direction = newDirection;
        }
    }

    function play() {

        //check if it is not first play and we need to refresh playing scene
        if (playingScoreContainer.style.cssText) {
            playingContainer.innerHTML = "";
            init(maxPosition);
        }

        playTimerId = setInterval(function(){
            moveSnake();
        }, 200);
    }

    /**
     * Class to create one simple block of snake or food,
     * depend on isFood flag.
     *
     * @param left
     * @param top
     * @param isFood
     * @constructor
     */
    function FigureBlock(left, top, isFood) {
        this.left = left;
        this.top = top;
        this.direction = 'right';
        this.element = document.createElement('div');
        this.element.classList.add(isFood ? 'food' : 'snake-block');
        this.element.style.cssText += "top:" + top + "px; left: " + left + "px;";
    }

    /**
     * Method to draw food element in random place of playing space
     *
     * @returns {boolean} // true - if random food coordinates not the same as one of snake block coordinates
     */
    function drawFood() {
        var foodLeft = Math.floor(Math.random() * (maxPosition - BLOCK_SIZE)/BLOCK_SIZE) * BLOCK_SIZE;
        var foodTop = Math.floor(Math.random() * (maxPosition - BLOCK_SIZE)/BLOCK_SIZE) * BLOCK_SIZE;

        //check if new food position not on snake
        for(var i = 0; i < snake.length; i++) {
            if (snake[i].left === foodLeft && snake[i].top === foodTop) {
                return false;
            }
        }

        food = new FigureBlock(foodLeft, foodTop, true);
        playingContainer.appendChild(food.element);
        return true;
    }

    /**
     * Moving snake, by adding new block at the begin of snake and remove last block.
     * Position of adding element depends on previous first block direction property,
     * it may be up/down/left/right.
     * Then check new coordinates of first element of snake,
     * if it outside the playing space or the same as one of the snake block the game is over,
     * if it the same as food coordinates than the last element not removed.
     */
    function moveSnake() {
        var currentDirection = snake[0].direction;
        var blockTop;
        var blockLeft;

        switch (currentDirection) {
            case 'up':
                blockTop = snake[0].top - BLOCK_SIZE;
                blockLeft = snake[0].left;
                break;
            case 'down':
                blockTop = snake[0].top + BLOCK_SIZE;
                blockLeft = snake[0].left;
                break;
            case 'left':
                blockTop = snake[0].top;
                blockLeft = snake[0].left - BLOCK_SIZE;
                break;
            case 'right':
                blockTop = snake[0].top;
                blockLeft = snake[0].left + BLOCK_SIZE;
                break;
        }
        if(checkPosition(blockLeft, blockTop)) {
            var snakeBlock = new FigureBlock(blockLeft, blockTop);
            snakeBlock.direction = currentDirection;
            snake.unshift(snakeBlock);
            playingContainer.insertBefore(snakeBlock.element, playingContainer.children[1]);

            //if eat food
            if (snakeBlock.top === food.top && snakeBlock.left === food.left) {
                foodCount++;
                food.element.parentNode.removeChild(food.element);
                while(!drawFood());
            }
            else {
                var snakeLastBlock = snake[snake.length - 1].element;
                snakeLastBlock.parentNode.removeChild(snakeLastBlock);
                snake.pop();
            }
        }
        else {
            endGame();
        }
    }

    /**
     * Check if new top/left position of first snake block
     * not on the playing space border and not on itself.
     *
     * @param left
     * @param top
     * @returns {boolean}
     */
    function checkPosition(left, top) {

        //check if position outside the playing container
        if (left < 0 || left >= maxPosition || top < 0 || top >= maxPosition) {
            return false;
        }

        //check if coordinates the same as itself block
        for(var i = 0; i < snake.length; i++) {
            if (left === snake[i].left && top === snake[i].top) {
                return false;
            }
        }

        return true;
    }

    function endGame() {
        clearInterval(playTimerId);
        playTimerId = null;

        fetch('/players',
            {
                method: 'post',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({name: gamerName, score: foodCount})
            });
        window.removeEventListener('keydown', onSnakeChangeDirection);
        playingContainerOverlay.style.cssText = ""; // remove display:none style
        playingScoreContainer.innerHTML = "<p>GAME OVER!</p><p>You score is: " + foodCount + "</p>"
        playingScoreContainer.style.cssText = "display:block;";
    }
})();