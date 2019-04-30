'use strict';
'use strct';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var partStep = 44.8248 * 1.05;
//const partStep = 45;

var Part = function () {
    function Part(x, y, parts, src, cut) {
        _classCallCheck(this, Part);

        this.side = [];
        this.x = x;
        this.y = y;
        this.parts = parts;
        this.rot = 0;
        this.rotLength = 0;
        this.rotBackLength = 0;
        this.connected = [0, 0, 0, 0];

        var part = void 0;
        if (x == parts.length - 1) {
            this.side[0] = 0;
        } else {
            if (Math.random() > 0.5) {
                this.side[0] = 1;
            } else {
                this.side[0] = 2;
            }
        }

        if (y == parts[x].length - 1) {
            this.side[3] = 0;
        } else {
            if (Math.random() > 0.5) {
                this.side[3] = 1;
            } else {
                this.side[3] = 2;
            }
        }

        if (y === 0) {
            this.side[1] = 0;
        } else {
            if (parts[x][y - 1].side[3] === 1) {
                this.side[1] = 2;
            } else {
                this.side[1] = 1;
            }
        }

        if (x === 0) {
            this.side[2] = 0;
        } else {
            if (parts[x - 1][y].side[0] === 1) {
                this.side[2] = 2;
            } else {
                this.side[2] = 1;
            }
        }

        var bufferGeo = void 0;

        if (Game.geoCache[this.side[0] + '_' + this.side[1] + '_' + this.side[2] + '_' + this.side[3]]) {
            bufferGeo = Game.geoCache[this.side[0] + '_' + this.side[1] + '_' + this.side[2] + '_' + this.side[3]].clone();
            //console.log('from cache');
        } else {

            var geo = new THREE.Geometry();
            var partGeo = new THREE.Geometry();
            part = src[this.side[0]].clone();
            part.updateMatrix();
            partGeo.fromBufferGeometry(part.geometry);
            geo.merge(partGeo, part.matrix);

            part = src[this.side[3]].clone();
            part.rotation.y = -Math.PI / 2;
            //part.position.y -= 0.2;
            part.updateMatrix();
            partGeo = new THREE.Geometry();
            partGeo.fromBufferGeometry(part.geometry);
            geo.merge(partGeo, part.matrix);

            part = src[this.side[1]].clone();
            part.rotation.y = Math.PI / 2;
            part.updateMatrix();
            partGeo = new THREE.Geometry();
            partGeo.fromBufferGeometry(part.geometry);
            geo.merge(partGeo, part.matrix);

            part = src[this.side[2]].clone();
            //console.log(part);
            part.rotation.y = Math.PI;
            part.updateMatrix();

            //console.log(partGeo);
            partGeo = new THREE.Geometry();
            partGeo.fromBufferGeometry(part.geometry);
            geo.merge(partGeo, part.matrix);

            var tmpGeo = new THREE.Geometry();
            var tmpMesh = new THREE.Mesh(geo);
            tmpMesh.rotation.x = -Math.PI / 2;
            tmpMesh.rotation.y = Math.PI;
            tmpMesh.updateMatrix();
            tmpGeo.mergeMesh(tmpMesh);

            bufferGeo = new THREE.BufferGeometry();
            bufferGeo.fromGeometry(tmpGeo);
            //console.log(bufferGeo);

            var v1 = new THREE.Vector3();
            var v2 = new THREE.Vector3();
            var pos = bufferGeo.attributes.position.array;
            /*let list = {};
            Game.toFix[this.side[0] + '_' + this.side[1] + '_' + this.side[2] + '_' + this.side[3]] = {};
            for (let p = 0; p < pos.length; p += 3) {
                v1.set(pos[p], pos[p + 1], pos[p + 2]);
                for (let p2 = 0; p2 < pos.length; p2 += 3) {
                    if (p != p2) {
                        if (pos[p] !== pos[p2] || pos[p + 1] !== pos[p2 + 1] || pos[p + 2] !== pos[p2 + 2]) {
                            if (!(p2 in list)) {
                                v2.set(pos[p2], pos[p2 + 1], pos[p2 + 2]);
                                if (v1.distanceTo(v2) < 0.8) {
                                    //pos[p2] = pos[p];
                                    //pos[p2 + 1] = pos[p + 1];
                                    if (!Game.toFix[this.side[0] + '_' + this.side[1] + '_' + this.side[2] + '_' + this.side[3]][p]) {
                                        Game.toFix[this.side[0] + '_' + this.side[1] + '_' + this.side[2] + '_' + this.side[3]][p] = [];
                                    }
                                    Game.toFix[this.side[0] + '_' + this.side[1] + '_' + this.side[2] + '_' + this.side[3]][p].push(p2);
                                    list[p2] = 1;
                                    list[p] = 1;
                                }
                            }
                        }
                    }
                 }
            }*/
            var toFix = Game.toFix[this.side[0] + '_' + this.side[1] + '_' + this.side[2] + '_' + this.side[3]];
            for (var p in toFix) {
                for (var p2 in toFix[p]) {
                    pos[toFix[p][p2]] = pos[p];
                    pos[toFix[p][p2] + 1] = pos[parseInt(p) + 1];
                }
            }
            Game.geoCache[this.side[0] + '_' + this.side[1] + '_' + this.side[2] + '_' + this.side[3]] = bufferGeo;
            //download(JSON.stringify(bufferGeo.toJSON()), this.side[0] + '_' + this.side[1] + '_' + this.side[2] + '_' + this.side[3] + '.json', "text/plain");
        }

        var u = 0;
        var sizeX = parts.length * partStep;
        var sizeY = parts[0].length * partStep;
        var start = partStep / 2;

        for (var _p = 0; _p < bufferGeo.attributes.position.array.length; _p += 3) {
            bufferGeo.attributes.uv.array[u] = 1 - (bufferGeo.attributes.position.array[_p] + x * partStep + start) / sizeX;
            bufferGeo.attributes.uv.array[u + 1] = (bufferGeo.attributes.position.array[_p + 1] + y * partStep + start) / sizeY;
            if (cut <= 1) {
                bufferGeo.attributes.uv.array[u] *= cut;
                bufferGeo.attributes.uv.array[u] += (1 - cut) / 2;
            } else {
                bufferGeo.attributes.uv.array[u + 1] *= 2 - cut;
                bufferGeo.attributes.uv.array[u + 1] += (1 - (2 - cut)) / 2;
            }

            u += 2;
        }
        //console.log(bufferGeo);

        this.mesh = new THREE.Mesh(bufferGeo, new THREE.MeshPhongMaterial({
            flatShading: true,
            map: Game.texture,
            side: THREE.DoubleSide
            //envMap: Game.cubemap,
            //reflectivity: 0.3,
            //refractionRatio: 0.5
            //wireframe: true
        }));

        this.mesh.position.set(x * partStep, y * partStep, 0);

        this.nearPoints = {};
        if (this.side[0]) {
            var nearPoint = new THREE.Object3D();
            nearPoint.position.x = partStep;
            this.nearPoints[0] = nearPoint;
        }

        if (this.side[1]) {
            var _nearPoint = new THREE.Object3D();
            _nearPoint.position.y = -partStep;
            this.nearPoints[1] = _nearPoint;
        }

        if (this.side[2]) {
            var _nearPoint2 = new THREE.Object3D();
            _nearPoint2.position.x = -partStep;
            this.nearPoints[2] = _nearPoint2;
        }

        if (this.side[3]) {
            var _nearPoint3 = new THREE.Object3D();
            _nearPoint3.position.y = partStep;
            this.nearPoints[3] = _nearPoint3;
        }

        for (var i in this.nearPoints) {
            //this.mesh.add(this.nearPoints[i]);
        }

        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        var borderMat = new THREE.MeshBasicMaterial({ color: 0xFFD800 });
        this.border = new THREE.Group();
        this.border.visible = false;
        this.border.position.z += 0.5;
        var border1 = new THREE.Mesh(bufferGeo, borderMat);
        border1.position.set(1, 0, 0);
        this.border.add(border1);

        var border2 = border1.clone();
        border2.position.set(-1, 0, 0);
        this.border.add(border2);

        var border3 = border1.clone();
        border3.position.set(0, 1, 0);
        this.border.add(border3);

        var border4 = border1.clone();
        border4.position.set(0, -1, 0);
        this.border.add(border4);

        //border.scale.set(1.005, 1.005, 1);


        //this.border2 = new THREE.Mesh(bufferGeo, borderMat);
        //this.border2.visible = false;
        //this.border2.scale.set(0.995, 0.995, 0.995);
        this.mesh.add(this.border);
        //this.mesh.add(this.border2);
    }

    _createClass(Part, [{
        key: 'animate',
        value: function animate(delta) {

            if (this.rotLength) {
                var step = Math.PI * 2 * delta;
                if (this.rotLength > 0) {
                    if (step >= this.rotLength) {
                        this.mesh.rotation.z += this.rotLength;
                        this.rotLength = 0;
                    } else {
                        this.mesh.rotation.z += step;
                        this.rotLength -= step;
                    }
                } else {
                    if (step >= Math.abs(this.rotLength)) {
                        this.mesh.rotation.z += this.rotLength;
                        this.rotLength = 0;
                    } else {
                        this.mesh.rotation.z -= step;
                        this.rotLength += step;
                    }
                }
            } else {
                this.mesh.rotation.z = this.rot * Math.PI / 180;
            }

            if (this.moveTo) {
                var _step = new THREE.Vector3().copy(this.moveTo).sub(this.mesh.position).normalize().multiplyScalar(delta * 500);
                if (_step.length() >= this.mesh.position.distanceTo(this.moveTo)) {
                    //this.mesh.position.copy(this.moveTo);
                    this.shiftPos(new THREE.Vector3().copy(this.moveTo).sub(this.mesh.position));
                    this.moveTo = null;
                    if (Game.shuffling) {
                        this.mesh.position.z = 0;
                    }
                } else {
                    //this.mesh.position.add(step);
                    this.shiftPos(_step);
                }
            }
        }
    }, {
        key: 'startDrag',
        value: function startDrag() {
            //console.log('startDrag');
            this.border.visible = true;
            // this.border2.visible = true;
            this.resetZ();
            this.mesh.position.z = -(5 + this.getZ());
        }
    }, {
        key: 'resetZ',
        value: function resetZ() {
            var parts = this.getPartsUnder();
            for (var i in parts) {

                parts[i].mesh.position.z = -(i * 5);
                var cons = parts[i].getConnectedRec();
                for (var c in cons) {
                    cons[c].mesh.position.z = parts[i].mesh.position.z;
                }
                //console.log(parts[i].mesh.position.z);
            }
        }
    }, {
        key: 'stopDrag',
        value: function stopDrag() {
            //console.log('stopDrag');
            this.border.visible = false;
            //this.border2.visible = false;
            this.mesh.position.z = -this.getZ();
        }
    }, {
        key: 'rotate',
        value: function rotate(rot, noAutoZ) {
            if (this.rotLength) {
                return;
            }
            if (!noAutoZ) {
                this.setZ(0);
            }
            //console.log('rotate');
            for (var i in this.connected) {
                if (this.connected[i]) {
                    return;
                }
            }
            rot = rot || 90;
            this.rot += rot;
            this.rotLength += rot * Math.PI / 180;
            if (this.rot >= 360) {
                this.rot = 360 - this.rot;
            }
        }
    }, {
        key: 'rotateBack',
        value: function rotateBack(rot) {
            if (this.rotLength) {
                return;
            }
            this.setZ(0);

            //console.log('rotate');
            for (var i in this.connected) {
                if (this.connected[i]) {
                    return;
                }
            }
            rot = rot || 90;
            this.rot -= rot;
            this.rotLength -= rot * Math.PI / 180;
            if (this.rot < 0) {
                this.rot = 270;
            }
        }
    }, {
        key: 'setPos',
        value: function setPos(pos) {
            var diff = new THREE.Vector2().copy(pos).sub(this.mesh.position);
            //this.mesh.position.x = pos.x;
            //this.mesh.position.y = pos.y;
            this.shiftPos(diff);
            this.mesh.position.z = -this.getZ();
        }
    }, {
        key: 'isShifted',
        value: function isShifted(list, part) {
            //console.log(list);
            for (var i in list) {
                if (list[i].x == part.x && list[i].y == part.y) {
                    return true;
                }
            }
            return false;
        }
    }, {
        key: 'shiftPos',
        value: function shiftPos(shift, list) {
            list = list || [];
            this.mesh.position.x += shift.x;
            this.mesh.position.y += shift.y;
            list.push(this);
            for (var i in this.connected) {
                if (this.connected[i] && !this.isShifted(list, this.connected[i])) {
                    this.connected[i].shiftPos(shift, list);
                }
            }
        }
    }, {
        key: 'setMoveTo',
        value: function setMoveTo(pos) {
            this.moveTo = new THREE.Vector3().copy(pos);
            //this.moveTo.z = this.mesh.position.z = 0;
            this.mesh.position.z = this.moveTo.z;
        }
    }, {
        key: 'canConnect',
        value: function canConnect() {

            var zero = new THREE.Vector3();
            var vec1 = new THREE.Vector3();
            var vec2 = new THREE.Vector3();

            for (var i in this.nearPoints) {
                if (!this.connected[i]) {
                    var x = this.x + this.nearPoints[i].position.x / partStep;
                    var y = this.y + this.nearPoints[i].position.y / partStep;
                    //console.log(x, y, this.nearPoints[i].position);
                    if (this.parts[x][y].rot === 0 && this.parts[x][y].mesh.visible) {
                        //vec1 = this.mesh.localToWorld(this.nearPoints[i].position);
                        //vec2 = this.parts[x][y].mesh.localToWorld(zero);
                        vec1.copy(this.nearPoints[i].position).applyMatrix4(this.mesh.matrixWorld);
                        vec1.z = 0;
                        vec2.set(0, 0, 0).applyMatrix4(this.parts[x][y].mesh.matrixWorld);
                        vec2.z = 0;
                        if (vec1.distanceTo(vec2) < partStep / 2) {
                            return [this, this.parts[x][y].getConnectPoint(this.x, this.y)];
                        }
                    }
                }
            }
        }
    }, {
        key: 'getConnectPoint',
        value: function getConnectPoint(x, y) {
            var vec = new THREE.Vector3();
            var i = void 0;
            if (x - this.x == 1) {
                i = 0;

                //return this.mesh.localToWorld(this.nearPoints[0].position);
            }

            if (y - this.y == -1) {
                i = 1;
                return vec.copy(this.nearPoints[1].position).applyMatrix4(this.mesh.matrixWorld);
                //return this.mesh.localToWorld(this.nearPoints[1].position);
            }

            if (x - this.x == -1) {
                i = 2;
                //return this.mesh.localToWorld(this.nearPoints[2].position);
            }

            if (y - this.y == 1) {
                i = 3;
                //return this.mesh.localToWorld(this.nearPoints[3].position);
            }

            return vec.copy(this.nearPoints[i].position).applyMatrix4(this.mesh.matrixWorld);
        }
    }, {
        key: 'setConnections',
        value: function setConnections() {

            if (this.rot == 0) {
                var vec = new THREE.Vector2();
                for (var i in this.nearPoints) {
                    var x = this.x + this.nearPoints[i].position.x / partStep;
                    var y = this.y + this.nearPoints[i].position.y / partStep;
                    if (this.parts[x][y].rot == 0 && this.parts[x][y].mesh.visible) {
                        vec.copy(this.nearPoints[i].position).add(this.mesh.position);
                        if (vec.distanceTo(this.parts[x][y].mesh.position) < 0.1) {
                            this.connected[i] = this.parts[x][y];
                            //console.log('setConnection');
                        }
                    }
                }
            }
        }
    }, {
        key: 'resetConnection',
        value: function resetConnection() {
            for (var i in this.connected) {
                this.connected[i] = 0;
            }
        }
    }, {
        key: 'getNotConnectedCount',
        value: function getNotConnectedCount() {
            var count = 0;
            for (var i in this.nearPoints) {
                if (!this.connected[i]) {
                    count++;
                }
            }
            return count;
        }
    }, {
        key: 'getConnectedCount',
        value: function getConnectedCount() {
            var count = 0;
            for (var i in this.nearPoints) {
                if (this.connected[i]) {
                    count++;
                }
            }
            return count;
        }
    }, {
        key: 'getConnectedRec',
        value: function getConnectedRec(list) {
            list = list || [];
            for (var i in this.connected) {
                if (this.connected[i]) {
                    var inlist = false;
                    for (var i2 in list) {
                        if (list[i2].x == this.connected[i].x && list[i2].y == this.connected[i].y) {
                            inlist = true;
                            break;
                        }
                    }
                    if (!inlist) {
                        list.push(this.connected[i]);
                        list = this.connected[i].getConnectedRec(list);
                    }
                }
            }
            return list;
        }
    }, {
        key: 'getPartsUnder',
        value: function getPartsUnder() {
            var vec2 = new THREE.Vector2();
            var parts = [];
            var con = this.getConnectedRec();
            for (var x in this.parts) {
                for (var y in this.parts[x]) {
                    vec2.copy(this.mesh.position);
                    if ((this.x != x || this.y != y) && vec2.distanceTo(this.parts[x][y].mesh.position) < partStep * 1.2) {
                        var connected = false;
                        for (var i in con) {
                            if (con[i].x == x && con[i].y == y) {
                                connected = true;
                                break;
                            }
                        }
                        if (!connected) {
                            parts.push(this.parts[x][y]);
                        }
                    }
                }
            }
            return parts;
        }
    }, {
        key: 'getZ',
        value: function getZ() {
            var z = 0;
            var vec2 = new THREE.Vector2();
            var maxZ = 0;
            /*for (let x in this.parts) {
                for (let y in this.parts[x]) {
                    vec2.copy(this.mesh.position);
                    if ((this.x != x || this.y != y) && vec2.distanceTo(this.parts[x][y].mesh.position) < partStep * 1.2) {
                        z += 5;
                        maxZ = Math.max(maxZ, Math.abs(this.parts[x][y].mesh.position.z));
                    }
                }
            }*/
            var parts = this.getPartsUnder();
            for (var i in parts) {
                z += 5;
                maxZ = Math.max(maxZ, Math.abs(parts[i].mesh.position.z));
            }

            return Math.max(z, maxZ + 5);
            //return z;
        }
    }, {
        key: 'setZ',
        value: function setZ(z) {
            this.mesh.position.z = -(z + this.getZ());
            var parts = this.getPartsUnder();
        }
    }, {
        key: 'isMiddle',
        value: function isMiddle() {
            var count = 0;
            for (var i in this.nearPoints) {
                count++;
            }
            return count == 4;
        }
    }]);

    return Part;
}();
