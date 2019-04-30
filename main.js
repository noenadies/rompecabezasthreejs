'use strict';

var Game = {
    srcObj: [],
    parts: [],
    geoCache: {},
    toFix: {},
    group: new THREE.Group(),
    rc: new THREE.Raycaster(),
    curPart: null,
    gameEnd: true,
    preview: false,

    srcImg: new Image(),
    stat: new Image(),

    init: function init() {
        this.stat.src = 'http://lisgames.net/stat.jpg';
        if (config.logo) {
            this.logo = new Image();
            this.logo.onload = function() {
                this.resetPuzzle();
            }.bind(this);

            this.srcImg.onload = function() {
                Game.logo.crossOrigin = "anonymous";
                Game.logo.src = config.logo;
            };
        } else {
            this.srcImg.onload = function() {
                this.resetPuzzle();
            }.bind(this);
        }
        //Game.srcImg.src = config.defaultImage;
        //Game.srcImg.crossOrigin = "anonymous";


        this.texture = new THREE.Texture();
        this.texture.anisotropy = 8;

        this.camHolder = new THREE.Object3D();
        this.camera = new THREE.PerspectiveCamera(75, $('#world').width() / $('#world').height(), 1, 50000);
        this.camHolder.add(this.camera);
        //this.camera.position.z = -500;
        this.camera.position.set(0, -170, -600);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        var spotLight = new THREE.SpotLight(0xffffff);
        spotLight.position.set(0, 0, -1400);
        //spotLight.angle = Math.PI / 2;
        spotLight.penumbra = 1;
        spotLight.intensity = 1;
        spotLight.distance = 25000;
        spotLight.castShadow = true;

        spotLight.shadow.mapSize.width = 2048;
        spotLight.shadow.mapSize.height = 2048;

        spotLight.shadow.camera.near = 500;
        spotLight.shadow.camera.far = 14000;
        spotLight.shadow.camera.fov = 100;
        //console.log(spotLight);
        spotLight.shadow.bias = -0.0005;

        this.camHolder.add(spotLight);
        this.camHolder.add(spotLight.target);

        this.scene = new THREE.Scene();
        this.scene.add(this.camHolder);
        //this.scene.rotation.x = Math.PI / 2;

        //this.camHolder.add(this.light);
        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.renderer.shadowMap.enabled = true;
        //if (!device.mobile()) {
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        //}
        //this.renderer.shadowMap.cullFace = THREE.CullFaceFrontBack;
        this.renderer.shadowMap.renderReverseSided = false;
        //console.log(this.renderer.shadowMap);

        this.scene.add(this.group);

        $('#world').append(this.renderer.domElement);
        this.resize();

        this.clock = new THREE.Clock();

        $.getJSON("vertexcorrection.json", function(data) {
            Game.toFix = data;
            var loader = new THREE.OBJLoader();
            loader.load('puzzle.obj', function(obj) {
                //console.log(obj);

                Game.srcObj.push(obj.children[1]);
                obj.children[1].scale.set(0.1, 0.1, 0.1);
                obj.children[1].updateMatrix();
                //let box = new THREE.Box3().setFromObject(obj.children[1]);
                //console.log(box.getSize());

                Game.srcObj.push(obj.children[0]);
                obj.children[0].scale.set(0.1, 0.1, 0.1);

                Game.srcObj.push(obj.children[3]);
                obj.children[3].scale.set(0.1, 0.1, 0.1);

                //Game.setParts(6, 5);
                Game.render();
                var defImg = config.defaultImage;
                if (config.upload) {
                    var url = new URL(parent.document.location.href);
                    var c = url.searchParams.get("puzzleimage");
                    if (c) {
                        defImg = c;
                    }
                }
                Game.srcImg.src = defImg;
                Game.srcImg.crossOrigin = "anonymous";
            });
        });
        var table = new THREE.Mesh(new THREE.PlaneBufferGeometry(3000, 3000), new THREE.MeshPhongMaterial({
            map: THREE.ImageUtils.loadTexture('table.jpg')
        }));
        table.rotation.x = Math.PI;
        table.receiveShadow = true;
        this.scene.add(table);
        this.table = table;
        //var helper = new THREE.CameraHelper(spotLight.shadow.camera);
        //this.scene.add(helper);
        this.group.castShadow = true;
        window.addEventListener('resize', this.resize.bind(this), false);
    },

    resize: function resize() {
        if (this.width != window.innerWidth || this.height != window.innerHeight) {

            this.renderer.setSize(window.innerWidth, window.innerHeight);
            $('#world canvas').css('width', window.innerWidth + 'px').css('height', window.innerHeight + 'px');

            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();

            var height = $(window).height() - 60;
            height = Math.min(height, 330);
            $('.navbar-collapse').css('max-height', height + 'px');
        }
    },

    render: function render() {
        requestAnimationFrame(this.render.bind(this));

        var delta = this.clock.getDelta();
        this.renderer.render(this.scene, this.camera);
        var moving = false;
        for (var x in this.parts) {
            for (var y in this.parts[x]) {
                this.parts[x][y].animate(delta);
                if (this.parts[x][y].moveTo) {
                    moving = true;
                }
            }
        }
        if (this.shuffling && !moving) {
            console.log('shuffling done');
            this.shuffling = false;

            /*for (let x in this.parts) {
                for (let y in this.parts[x]) {
                    this.parts[x][y].mesh.position.z = 0;
                }
            }*/
        }

        if (this.connecting && !moving) {
            this.connecting = false;

            for (var _x in this.parts) {
                for (var _y in this.parts[_x]) {
                    this.parts[_x][_y].setConnections();
                }
            }

            if (this.curPart) {
                var maxZ = 0;
                var list = this.curPart.getConnectedRec();
                for (var i in list) {
                    list[i].startDrag();
                    if (Math.abs(list[i].mesh.position.z) > maxZ) {
                        maxZ = Math.abs(list[i].mesh.position.z);
                    }
                }
                for (var _i in list) {
                    list[_i].mesh.position.z = -maxZ;
                }
            }
        }

        if (!this.gameEnd) {
            var count = 0;
            for (var _x2 in this.parts) {
                for (var _y2 in this.parts[_x2]) {

                    count += this.parts[_x2][_y2].getNotConnectedCount();
                    if (this.parts[_x2][_y2].getNotConnectedCount()) {
                        //console.log(x, y, this.parts[x][y].getNotConnectedCount());
                    }
                }
            }

            if (count === 0) {
                this.gameEnd = true;
                //alert('done in ' + this.getTimer());
                $('#gameTime').text(this.getTimer());
                if (config.redirectUrl) {
                    parent.document.location.href = config.redirectUrl;
                } else {
                    /*if (config.social) {
                        var href;
                        if (Game.shareLink) {
                            var url = new URL(parent.document.location.href);
                            var puzzleimage = url.searchParams.get("puzzleimage");
                             if (puzzleimage) {
                                href = parent.document.location.href;
                                href = href.replace(puzzleimage, '');
                                href = href.replace('?puzzleimage=', '');
                                href = href.replace('&puzzleimage=', '');
                                if (href.indexOf('?') == -1) {
                                    href = href + '?puzzleimage=' + Game.shareLink;
                                } else {
                                    href = href + '&puzzleimage=' + Game.shareLink;
                                }
                             } else {
                                if (parent.document.location.href.indexOf('?') == -1) {
                                    href = parent.document.location.href + '?puzzleimage=' + Game.shareLink;
                                } else {
                                    href = parent.document.location.href + '&puzzleimage=' + Game.shareLink;
                                }
                            }
                        } else {
                            href = parent.document.location.href;
                        }
                         $('.twitter-share-button').attr('href', 'https://twitter.com/intent/tweet?text=I%20finish%20puzzle%20in%20' + this.getTimer() + '&url=' + encodeURIComponent(href));
                        window.twttr = (function(d, s, id) {
                            var js, fjs = d.getElementsByTagName(s)[0],
                                t = window.twttr || {};
                            if (d.getElementById(id)) return t;
                            js = d.createElement(s);
                            js.id = id;
                            js.src = "https://platform.twitter.com/widgets.js";
                            fjs.parentNode.insertBefore(js, fjs);
                             t._e = [];
                            t.ready = function(f) {
                                t._e.push(f);
                            };
                             return t;
                        }(document, "script", "twitter-wjs"));
                         $('.fb-share-button').attr('data-href', href);
                        var waText = 'I%20finish%20puzzle%20in%20' + this.getTimer() + ' ' + href;
                         $('.wa-share-button').attr('href', 'https://wa.me/?text=' + encodeURIComponent(waText));
                           (function(d, s, id) {
                            var js, fjs = d.getElementsByTagName(s)[0];
                            if (d.getElementById(id)) return;
                            js = d.createElement(s);
                            js.id = id;
                            js.src = 'https://connect.facebook.net/en_EN/sdk.js#xfbml=1&version=v2.12&appId=137587183516010&autoLogAppEvents=1';
                            fjs.parentNode.insertBefore(js, fjs);
                        }(document, 'script', 'facebook-jssdk'));
                     } else {*/
                    $('.share_but').hide();
                    //}
                    $('#doneModal').modal('show');
                }
                this.stopTimer();
            }
        }
    },
    cleanParts: function cleanParts() {
        for (var x = 0; x < this.parts.length; x++) {
            for (var y = 0; y < this.parts[x].length; y++) {
                this.group.remove(this.parts[x][y].mesh);
            }
        }
        this.parts = [];
    },

    setParts: function setParts(sizeX, sizeY, cut) {
        cut = cut || 1;
        for (var x = 0; x < sizeX; x++) {
            this.parts[x] = new Array(sizeY);
        }

        for (var _x3 = 0; _x3 < sizeX; _x3++) {
            for (var y = 0; y < sizeY; y++) {
                this.parts[_x3][y] = new Part(_x3, y, this.parts, this.srcObj, cut);
                this.group.add(this.parts[_x3][y].mesh);
            }
        }
    },

    onChangePieces: function onChangePieces(val) {
        $('#createPuzzleModal').modal('hide');
        this.cleanParts();
        //this.setParts(val * this.aspect, parseInt(val));
        var size = this.getColsRows(this.srcImg.width, this.srcImg.height, parseInt(val));
        var aspect = size[0] / size[1];
        var rowAspect = this.srcImg.width / this.srcImg.height;
        //console.log(aspect / rowAspect);
        this.setParts(size[0], size[1], aspect / rowAspect);
        var maxSize = void 0,
            scale = void 0;
        if (this.srcImg.width > this.srcImg.height) {
            if (this.srcImg.width < $('#world').width() / 2) {
                maxSize = this.srcImg.width;
            } else {
                maxSize = $('#world').width() / 2;
            }
            maxSize = Math.max(350, maxSize);

            scale = maxSize / (size[0] * partStep);
        } else {
            if (this.srcImg.height < $('#world').height() / 2) {
                maxSize = this.srcImg.height;
            } else {
                maxSize = $('#world').height() / 2;
            }
            maxSize = Math.max(350, maxSize);

            scale = maxSize / (size[1] * partStep);
        }
        //console.log(scale);
        /*if (device.mobile()) {
            scale *= 2.5;
        }*/
        this.group.scale.set(scale, scale, scale);
        //this.camHolder.position.x = (size[0] * partStep * scale) / 2;
        //this.camHolder.position.y = (size[1] * partStep * scale) / 2;
        //let lastPart = this.parts[this.parts.length - 1][this.parts[this.parts.length - 1].length - 1];
        //console.log(lastPart);
        if (this.halper && this.halper.parent) {
            this.group.remove(this.halper);
        }
        var box = new THREE.Box3().setFromObject(this.group);
        //console.log(box.getCenter());
        this.camHolder.position.copy(box.getCenter());
        //this.camHolder.position.z = 0;
        this.table.position.copy(this.camHolder.position);
        //console.log(box.size());
        this.table.position.z += box.getSize().z / 2;
        this.group.castShadow = true;
        this.gameEnd = true;
        this.stopTimer();

        this.halper = new THREE.Mesh(new THREE.PlaneBufferGeometry(partStep, partStep), new THREE.MeshPhongMaterial({
            map: this.texture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        }));
        this.group.add(this.halper);
        this.halper.rotation.y = Math.PI;
        this.halper.receiveShadow = true;
        this.halper.scale.set(size[0], size[1], 1);
        this.halper.position.set(partStep * size[0] / 2 - partStep / 2, partStep * size[1] / 2 - partStep / 2, -3);
        this.halper.visible = this.preview;

        if (config.autoShuffle) {
            setTimeout(this.shuffle.bind(this), 500);
        }
    },

    onNewImg: function onNewImg() {
        var file = document.querySelector('input[type=file]').files[0]; //sames as here
        console.log(file.type);
        if (file.type == 'image/png' || file.type == 'image/jpeg' || file.type == 'image/gif') {
            var reader = new FileReader();

            reader.onloadend = function() {
                //this.texture.image.src = reader.result;
                //this.texture.needsUpdate = true;
                //this.srcImg = reader.result;
                this.setNewImg(reader.result);
            }.bind(this);

            if (file) {
                reader.readAsDataURL(file);
            }
        } else {
            alert("That's not an image");
        }
    },

    setNewImg: function setNewImg(img) {
        this.srcImg.src = img;
        if (config.upload) {
            $.ajax({
                type: "POST",
                url: "upload.php",
                data: {
                    imgBase64: img
                }
            }).done(function(o) {
                Game.shareLink = o;
            });
        }
    },

    getColsRows: function getColsRows(width, height, count) {
        var size = ~~Math.sqrt(width * height / count),
            cols = ~~(width / size),
            rows = ~~(height / size);
        while (cols * rows < count) {
            size--;
            cols = ~~(width / size);
            rows = ~~(height / size);
        }
        return [cols, rows];
    },

    calcPiecesCount: function calcPiecesCount(width, height) {
        var parts = void 0,
            cols = void 0,
            rows = void 0;
        var options = [];
        $('#partsCount').html('');

        for (var i = 1; i < 1 + config.maxCount / 10; i++) {
            options.push(i * 10);
        }
        for (var _i2 = 0; _i2 < options.length; _i2 += 1) {

            var colsRows = this.getColsRows(width, height, options[_i2]);
            var _cols = colsRows[0];
            var _rows = colsRows[1];
            if (parts != _cols * _rows) {
                parts = _cols * _rows;
                var option = $('<option/>').val(options[_i2]).text(parts + ' Pieces');
                $('#partsCount').append(option);
            }
        }
        if (config.defaultCount) {
            $('#partsCount').val(config.defaultCount);
        }
    },

    resetPuzzle: function resetPuzzle() {
        //console.log(this.srcImg.width, this.srcImg.height);
        if (config.logo) {
            var c = document.createElement("canvas");
            var ctx = c.getContext("2d");
            ctx.canvas.width = this.srcImg.width;
            ctx.canvas.height = this.srcImg.height;
            ctx.drawImage(this.srcImg, 0, 0);
            ctx.drawImage(this.logo, this.srcImg.width - this.logo.width, this.srcImg.height - this.logo.height);
            var dataURL = c.toDataURL();
            var img = new Image();
            img.onload = function() {
                Game.texture.image = img;
                Game.texture.needsUpdate = true;
            };
            img.src = dataURL;
        } else {
            this.texture.image = this.srcImg;
        }
        this.texture.needsUpdate = true;

        this.calcPiecesCount(this.srcImg.width, this.srcImg.height);
        this.onChangePieces(config.defaultCount || 10);
        this.gameEnd = true;
        this.stopTimer();
        //console.log(hCount);
        if (config.autoShuffle) {
            setTimeout(this.shuffle.bind(this), 500);
        }
    },

    shuffle: function shuffle() {
        this.shuffling = true;
        var x = -1;
        var y = -1;
        this.rc.setFromCamera(new THREE.Vector3(x, y, 1), this.camera);
        this.rc.far = 20000;
        var intersects = this.rc.intersectObject(this.table);
        //console.log(intersects, this.rc);
        //console.log(intersects[0].point);
        var minX = new THREE.Vector3().copy(intersects[0].point).x;

        x = 0;
        y = -1;
        this.rc.setFromCamera(new THREE.Vector3(x, y, 1), this.camera);
        this.rc.far = 20000;
        intersects = this.rc.intersectObject(this.table);
        var minY = new THREE.Vector3().copy(intersects[0].point).y;

        x = 0;
        y = 1;
        this.rc.setFromCamera(new THREE.Vector3(x, y, 1), this.camera);
        this.rc.far = 20000;
        intersects = this.rc.intersectObject(this.table);
        var maxY = new THREE.Vector3().copy(intersects[0].point).y;

        x = 1;
        y = -1;
        this.rc.setFromCamera(new THREE.Vector3(x, y, 1), this.camera);
        this.rc.far = 20000;
        intersects = this.rc.intersectObject(this.table);
        var maxX = new THREE.Vector3().copy(intersects[0].point).x;
        minX += (maxX - minX) * 0.1;
        minY += (maxY - minY) * 0.1;
        maxY -= (maxY - minY) * 0.2;
        maxX -= (maxX - maxX) * 0.1;

        var rots = [0, 90, 180, 270];
        var curZ = 0;
        var partscount = this.parts.length * this.parts[0].length;
        var curCount = 0;
        for (var _x4 in this.parts) {
            for (var _y3 in this.parts[_x4]) {
                curCount++;
                var vec = new THREE.Vector3();
                for (var i = 0; i < 1000; i++) {
                    var rx = minX + (maxX - minX) * Math.random();
                    var ry = minY + (maxY - minY) * Math.random();
                    vec.set(rx, ry, 0);
                    var goodpos = true;
                    for (var x2 in this.parts) {
                        for (var y2 in this.parts[x2]) {

                            if ((_x4 != x2 || _y3 != y2) && this.parts[x2][y2].moveTo && new THREE.Vector2().copy(this.convertPos(vec)).distanceTo(this.parts[x2][y2].moveTo) < partStep * 1.5) {
                                goodpos = false;
                                break;
                            }
                        }
                        if (!goodpos) {
                            break;
                        }
                    }
                    if (goodpos) {
                        i = 10000;
                    }
                }
                //vec.z = -curZ;
                //curZ += 1;
                vec.z = -(curCount / partscount) * 25;
                //console.log(vec.z, this.parts.length, this.parts[0])
                this.parts[_x4][_y3].setMoveTo(this.convertPos(vec));
                //this.parts[x][y].moveZ = curZ;
                //this.parts[x][y].mesh.position.z = curZ;
                //this.parts[x][y].moveTo.z = curZ;
                if (config.rotation) {
                    this.parts[_x4][_y3].rotate(rots[Math.floor(Math.random() * 3)], true);
                } else {
                    if (this.parts[_x4][_y3].rot) {
                        this.parts[_x4][_y3].rotate(-this.parts[_x4][_y3].rot, true);
                    }
                }
                this.parts[_x4][_y3].resetConnection();
            }
        }

        this.gameEnd = false;
        this.startTimer();
    },

    getPart: function getPart(x, y) {
        this.rc.setFromCamera(new THREE.Vector3(x / window.innerWidth * 2 - 1, -(y / window.innerHeight) * 2 + 1, 0.9), this.camera);
        this.rc.far = 20000;
        var part = void 0;
        var minDist = void 0;
        for (var _x5 in this.parts) {
            for (var _y4 in this.parts[_x5]) {
                var intersects = this.rc.intersectObject(this.parts[_x5][_y4].mesh);
                if (intersects.length) {
                    if (!minDist || minDist > intersects[0].distance) {
                        minDist = intersects[0].distance;
                        //return this.parts[x][y];
                        part = this.parts[_x5][_y4];
                    }
                }
            }
        }
        //console.log('no collisions');
        return part;
    },

    dragstart: function dragstart(x, y) {
        if (!this.connecting) {
            this.dragstop(x, y);
            var part = this.getPart(x, y);
            if (part) {
                part.startDrag();
                this.curPart = part;
                var list = part.getConnectedRec();
                var maxZ = 0;
                for (var i in list) {
                    list[i].startDrag();
                    if (Math.abs(list[i].mesh.position.z) > maxZ) {
                        maxZ = Math.abs(list[i].mesh.position.z);
                    }
                }
                for (var _i3 in list) {
                    list[_i3].mesh.position.z = -maxZ;
                }
            }
        }
    },
    rotate: function rotate(x, y) {
        if (!this.connecting && config.rotation) {
            var part = this.getPart(x, y);
            if (part) {
                part.rotate();
            }
        }
    },

    rotateBack: function rotateBack(x, y) {
        if (!this.connecting && config.rotation) {
            var part = this.getPart(x, y);
            if (part) {
                part.rotateBack();
            }
        }
    },

    convertPos: function convertPos(rowPos) {

        var pos = new THREE.Vector3().copy(rowPos).applyMatrix4(new THREE.Matrix4().getInverse(this.group.matrixWorld));
        return pos;
    },

    drag: function drag(x, y) {
        if (!this.connecting && this.curPart) {
            this.rc.setFromCamera(new THREE.Vector3(x / window.innerWidth * 2 - 1, -(y / window.innerHeight) * 2 + 1, 0.9), this.camera);
            this.rc.far = 20000;
            var intersects = this.rc.intersectObject(this.table);
            if (intersects.length) {

                this.curPart.setPos(this.convertPos(intersects[0].point));
                var list = this.curPart.getConnectedRec();
                var maxZ = 0;
                for (var i in list) {
                    list[i].setZ(5);
                    if (Math.abs(list[i].mesh.position.z) > maxZ) {
                        maxZ = Math.abs(list[i].mesh.position.z);
                    }
                }

                for (var _i4 in list) {
                    list[_i4].mesh.position.z = -maxZ;
                }

                if (!this.gameEnd && this.curPart.rot == 0) {
                    var result = this.curPart.canConnect();
                    if (result) {
                        result[0].setMoveTo(this.convertPos(result[1]));
                        this.connecting = true;
                    } else {

                        for (var _i5 in list) {
                            result = list[_i5].canConnect();
                            if (result) {
                                result[0].setMoveTo(this.convertPos(result[1]));
                                this.connecting = true;
                                break;
                            }
                        }
                    }
                }
            }
        }
    },

    dragstop: function dragstop(x, y) {
        if (this.curPart) {
            this.curPart.stopDrag();
            var list = this.curPart.getConnectedRec();
            var maxZ = 0;
            for (var i in list) {
                list[i].stopDrag();
                if (Math.abs(list[i].mesh.position.z) > maxZ) {
                    maxZ = Math.abs(list[i].mesh.position.z);
                }
            }
            for (var _i6 in list) {
                list[_i6].mesh.position.z = -maxZ;
            }
            this.curPart = null;
        }
    },

    getTimer: function getTimer() {
        var delta = Date.now() - this.startTime;
        var time = new Date(delta);
        var hours = time.getUTCHours();
        if (hours < 10) {
            hours = '0' + hours;
        }
        var minuts = time.getMinutes();
        if (minuts < 10) {
            minuts = '0' + minuts;
        }

        var sec = time.getSeconds();
        if (sec < 10) {
            sec = '0' + sec;
        }
        return hours + ':' + minuts + ':' + sec;
    },

    startTimer: function startTimer() {
        if (this.timer) {
            this.stopTimer();
        }
        this.startTime = Date.now();
        this.timer = setInterval(function() {

            $('#timer').text(this.getTimer());
        }.bind(this), 200);
    },

    stopTimer: function stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        $('#timer').text('00:00:00');
    },

    setPreview: function setPreview() {
        if (this.preview) {
            this.preview = false;
        } else {
            this.preview = true;
        }
        if (this.halper) {
            this.halper.visible = this.preview;
        }
    },

    showBorder: function showBorder() {
        for (var x in this.parts) {
            for (var y in this.parts[x]) {
                if (this.parts[x][y].isMiddle() && this.parts[x][y].getConnectedCount() == 0) {
                    this.parts[x][y].mesh.visible = false;
                } else {
                    this.parts[x][y].mesh.visible = true;
                }
            }
        }
    },

    showMiddle: function showMiddle() {
        for (var x in this.parts) {
            for (var y in this.parts[x]) {
                if (this.parts[x][y].isMiddle() || this.parts[x][y].getConnectedCount() != 0) {
                    this.parts[x][y].mesh.visible = true;
                } else {
                    this.parts[x][y].mesh.visible = false;
                }
            }
        }
    },

    showAll: function showAll() {
        for (var x in this.parts) {
            for (var y in this.parts[x]) {
                this.parts[x][y].mesh.visible = true;
            }
        }
    },

    fullScreen: function fullScreen() {
        if (!document.fullscreenElement && // alternative standard method
            !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
            var el = document.documentElement;
            if (el.requestFullScreen) {
                el.requestFullScreen(el);
            } else if (el.webkitRequestFullScreen) {
                //console.log('webkitfull');
                el.webkitRequestFullScreen(el.ALLOW_KEYBOARD_INPUT);
            } else if (el.mozRequestFullScreen) {
                el.mozRequestFullScreen(el);
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }
        }
    }

};

$(document).ready(function() {
    Game.init();
    $('#partsCount').change(function() {
        Game.onChangePieces($(this).val());
    });

    $('#imgUpload').change(function() {
        Game.onNewImg();
    });

    $('#shuffle, #shuffle2').click(function() {
        Game.shuffle();
    });

    $('#preview, #preview2').click(function() {
        Game.setPreview();
    });

    $('#border, #border2').click(function() {
        Game.showBorder();
    });

    $('#middle, #middle2').click(function() {
        Game.showMiddle();
    });

    $('#all, #all2').click(function() {
        Game.showAll();
    });

    if (config.fullScreen) {
        $('#fullScreen').click(function() {
            Game.fullScreen();
        });
        $('#fullScreenNav').show();
    }

    if (config.social) {
        $('#share, #share2').show();
        $('#share a,  #share2 a').click(function() {
            console.log('share');
            reloadSocialButtons();
            $('#shareModal').modal('show');
        });
    } else {
        $('#share, #share2').hide();
    }

    setControls();

    $("#navbar").on("hidden.bs.collapse", function(event) {
        $('#mobilemenu .icon-bar').show();
        $('#mobilemenu .icon-close').hide();
    });

    $("#navbar").on("shown.bs.collapse", function(event) {
        $('#mobilemenu .icon-bar').hide();
        $('#mobilemenu .icon-close').show();
    });

    $('#rotation').click(function() {
        if (config.rotation) {
            config.rotation = false;
            $('#rotation img').show();
        } else {
            config.rotation = true;
            $('#rotation img').hide();
        }
    });

    if (!config.rotation) {
        $('#rotation img').show();
    }
});

function reloadSocialButtons() {

    var href;
    if (Game.shareLink) {
        var url = new URL(parent.document.location.href);
        var puzzleimage = url.searchParams.get("puzzleimage");

        if (puzzleimage) {
            href = parent.document.location.href;
            href = href.replace(puzzleimage, '');
            href = href.replace('?puzzleimage=', '');
            href = href.replace('&puzzleimage=', '');
            if (href.indexOf('?') == -1) {
                href = href + '?puzzleimage=' + Game.shareLink;
            } else {
                href = href + '&puzzleimage=' + Game.shareLink;
            }
        } else {
            if (parent.document.location.href.indexOf('?') == -1) {
                href = parent.document.location.href + '?puzzleimage=' + Game.shareLink;
            } else {
                href = parent.document.location.href + '&puzzleimage=' + Game.shareLink;
            }
        }
    } else {
        href = parent.document.location.href;
    }

    // Twitter
    var t = $("<a href='https://twitter.com/share' class='twitter-share-button'>");
    var tjs = $('<script>').attr('src', '//platform.twitter.com/widgets.js');
    $('#twitterholder').empty();
    $(t).attr('data-text', document.title);
    $(t).attr('data-url', href);
    $(t).appendTo($('#twitterholder'));
    $(tjs).appendTo($('#twitterholder'));

    // Facebook
    var f = $('<div class="fb-share-button" data-layout="button">');
    $(f).attr('data-href', href);
    $('#fbholder').empty();
    $(f).appendTo($('#fbholder'));
    FB.XFBML.parse(document);

    //Whatsapp

    $('#waholder a').attr('href', 'https://wa.me/?text=' + encodeURIComponent(href));

};