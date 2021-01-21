THREE.AnimationHandler = function() {
    var a = [],
        d = {},
        b = {};
    b.update = function(c) {
        for (var f = 0; f < a.length; f++) a[f].update(c)
    };
    b.addToUpdate = function(c) {
        a.indexOf(c) === -1 && a.push(c)
    };
    b.removeFromUpdate = function(c) {
        c = a.indexOf(c);
        c !== -1 && a.splice(c, 1)
    };
    b.add = function(c) {
        d[c.name] !== undefined && console.log("THREE.AnimationHandler.add: Warning! " + c.name + " already exists in library. Overwriting.");
        d[c.name] = c;
        if (c.initialized !== !0) {
            for (var f = 0; f < c.hierarchy.length; f++) {
                for (var g = 0; g < c.hierarchy[f].keys.length; g++) {
                    if (c.hierarchy[f].keys[g].time < 0) c.hierarchy[f].keys[g].time = 0;
                    if (c.hierarchy[f].keys[g].rot !== undefined && !(c.hierarchy[f].keys[g].rot instanceof THREE.Quaternion)) {
                        var h = c.hierarchy[f].keys[g].rot;
                        c.hierarchy[f].keys[g].rot = new THREE.Quaternion(h[0], h[1], h[2], h[3])
                    }
                }
                if (c.hierarchy[f].keys[0].morphTargets !== undefined) {
                    h = {};
                    for (g = 0; g < c.hierarchy[f].keys.length; g++)
                        for (var j = 0; j < c.hierarchy[f].keys[g].morphTargets.length; j++) {
                            var l = c.hierarchy[f].keys[g].morphTargets[j];
                            h[l] = -1
                        }
                    c.hierarchy[f].usedMorphTargets = h;
                    for (g = 0; g < c.hierarchy[f].keys.length; g++) {
                        var k = {};
                        for (l in h) {
                            for (j = 0; j < c.hierarchy[f].keys[g].morphTargets.length; j++)
                                if (c.hierarchy[f].keys[g].morphTargets[j] === l) {
                                    k[l] = c.hierarchy[f].keys[g].morphTargetsInfluences[j];
                                    break
                                }
                            j === c.hierarchy[f].keys[g].morphTargets.length && (k[l] = 0)
                        }
                        c.hierarchy[f].keys[g].morphTargetsInfluences = k
                    }
                }
                for (g = 1; g < c.hierarchy[f].keys.length; g++)
                    if (c.hierarchy[f].keys[g].time === c.hierarchy[f].keys[g - 1].time) {
                        c.hierarchy[f].keys.splice(g, 1);
                        g--
                    }
                for (g = 1; g < c.hierarchy[f].keys.length; g++) c.hierarchy[f].keys[g].index = g
            }
            g = parseInt(c.length * c.fps, 10);
            c.JIT = {};
            c.JIT.hierarchy = [];
            for (f = 0; f < c.hierarchy.length; f++) c.JIT.hierarchy.push(Array(g));
            c.initialized = !0
        }
    };
    b.get = function(c) {
        if (typeof c === "string")
            if (d[c]) return d[c];
            else {
                console.log("THREE.AnimationHandler.get: Couldn't find animation " + c);
                return null
            }
    };
    b.parse = function(c) {
        var f = [];
        if (c instanceof THREE.SkinnedMesh)
            for (var g = 0; g < c.bones.length; g++) f.push(c.bones[g]);
        else e(c, f);
        return f
    };
    var e = function(c, f) {
        f.push(c);
        for (var g = 0; g < c.children.length; g++) e(c.children[g], f)
    };
    b.LINEAR = 0;
    b.CATMULLROM = 1;
    b.CATMULLROM_FORWARD = 2;
    return b
}();
THREE.Animation = function(a, d, b, e) {
    this.root = a;
    this.data = THREE.AnimationHandler.get(d);
    this.hierarchy = THREE.AnimationHandler.parse(a);
    this.currentTime = 0;
    this.timeScale = 1;
    this.isPlaying = !1;
    this.isPaused = !0;
    this.loop = !0;
    this.interpolationType = b !== undefined ? b : THREE.AnimationHandler.LINEAR;
    this.JITCompile = e !== undefined ? e : !0;
    this.points = [];
    this.target = new THREE.Vector3
};
THREE.Animation.prototype.play = function(a, d) {
    if (!this.isPlaying) {
        this.isPlaying = !0;
        this.loop = a !== undefined ? a : !0;
        this.currentTime = d !== undefined ? d : 0;
        var b, e = this.hierarchy.length,
            c;
        for (b = 0; b < e; b++) {
            c = this.hierarchy[b];
            if (this.interpolationType !== THREE.AnimationHandler.CATMULLROM_FORWARD) c.useQuaternion = !0;
            c.matrixAutoUpdate = !0;
            if (c.animationCache === undefined) {
                c.animationCache = {};
                c.animationCache.prevKey = {
                    pos: 0,
                    rot: 0,
                    scl: 0
                };
                c.animationCache.nextKey = {
                    pos: 0,
                    rot: 0,
                    scl: 0
                };
                c.animationCache.originalMatrix = c instanceof THREE.Bone ? c.skinMatrix : c.matrix
            }
            var f = c.animationCache.prevKey;
            c = c.animationCache.nextKey;
            f.pos = this.data.hierarchy[b].keys[0];
            f.rot = this.data.hierarchy[b].keys[0];
            f.scl = this.data.hierarchy[b].keys[0];
            c.pos = this.getNextKeyWith("pos", b, 1);
            c.rot = this.getNextKeyWith("rot", b, 1);
            c.scl = this.getNextKeyWith("scl", b, 1)
        }
        this.update(0)
    }
    this.isPaused = !1;
    THREE.AnimationHandler.addToUpdate(this)
};
THREE.Animation.prototype.pause = function() {
    this.isPaused ? THREE.AnimationHandler.addToUpdate(this) : THREE.AnimationHandler.removeFromUpdate(this);
    this.isPaused = !this.isPaused
};
THREE.Animation.prototype.stop = function() {
    this.isPlaying = !1;
    this.isPaused = !1;
    THREE.AnimationHandler.removeFromUpdate(this);
    for (var a = 0; a < this.hierarchy.length; a++)
        if (this.hierarchy[a].animationCache !== undefined) {
            if (this.hierarchy[a] instanceof THREE.Bone) this.hierarchy[a].skinMatrix = this.hierarchy[a].animationCache.originalMatrix;
            else this.hierarchy[a].matrix = this.hierarchy[a].animationCache.originalMatrix;
            delete this.hierarchy[a].animationCache
        }
};
THREE.Animation.prototype.update = function(a) {
    if (this.isPlaying) {
        var d = ["pos", "rot", "scl"],
            b, e, c, f, g, h, j, l, k = this.data.JIT.hierarchy,
            m, p;
        this.currentTime += a * this.timeScale;
        p = this.currentTime;
        m = this.currentTime %= this.data.length;
        l = parseInt(Math.min(m * this.data.fps, this.data.length * this.data.fps), 10);
        for (var o = 0, x = this.hierarchy.length; o < x; o++) {
            a = this.hierarchy[o];
            j = a.animationCache;
            if (this.JITCompile && k[o][l] !== undefined)
                if (a instanceof THREE.Bone) {
                    a.skinMatrix = k[o][l];
                    a.matrixAutoUpdate = !1;
                    a.matrixWorldNeedsUpdate = !1
                } else {
                    a.matrix = k[o][l];
                    a.matrixAutoUpdate = !1;
                    a.matrixWorldNeedsUpdate = !0
                }
            else {
                if (this.JITCompile)
                    if (a instanceof THREE.Bone) a.skinMatrix = a.animationCache.originalMatrix;
                    else a.matrix = a.animationCache.originalMatrix;
                for (var w = 0; w < 3; w++) {
                    b = d[w];
                    g = j.prevKey[b];
                    h = j.nextKey[b];
                    if (h.time <= p) {
                        if (m < p)
                            if (this.loop) {
                                g = this.data.hierarchy[o].keys[0];
                                for (h = this.getNextKeyWith(b, o, 1); h.time < m;) {
                                    g = h;
                                    h = this.getNextKeyWith(b, o, h.index + 1)
                                }
                            } else {
                                this.stop();
                                return
                            }
                        else {
                            do {
                                g = h;
                                h = this.getNextKeyWith(b, o, h.index + 1)
                            } while (h.time < m)
                        }
                        j.prevKey[b] = g;
                        j.nextKey[b] = h
                    }
                    a.matrixAutoUpdate = !0;
                    a.matrixWorldNeedsUpdate = !0;
                    e = (m - g.time) / (h.time - g.time);
                    c = g[b];
                    f = h[b];
                    if (e < 0 || e > 1) {
                        console.log("THREE.Animation.update: Warning! Scale out of bounds:" + e + " on bone " + o);
                        e = e < 0 ? 0 : 1
                    }
                    if (b === "pos") {
                        b = a.position;
                        if (this.interpolationType === THREE.AnimationHandler.LINEAR) {
                            b.x = c[0] + (f[0] - c[0]) * e;
                            b.y = c[1] + (f[1] - c[1]) * e;
                            b.z = c[2] + (f[2] - c[2]) * e
                        } else if (this.interpolationType === THREE.AnimationHandler.CATMULLROM || this.interpolationType === THREE.AnimationHandler.CATMULLROM_FORWARD) {
                            this.points[0] = this.getPrevKeyWith("pos", o, g.index - 1).pos;
                            this.points[1] = c;
                            this.points[2] = f;
                            this.points[3] = this.getNextKeyWith("pos", o, h.index + 1).pos;
                            e = e * 0.33 + 0.33;
                            c = this.interpolateCatmullRom(this.points, e);
                            b.x = c[0];
                            b.y = c[1];
                            b.z = c[2];
                            if (this.interpolationType === THREE.AnimationHandler.CATMULLROM_FORWARD) {
                                e = this.interpolateCatmullRom(this.points, e * 1.01);
                                this.target.set(e[0], e[1], e[2]);
                                this.target.subSelf(b);
                                this.target.y = 0;
                                this.target.normalize();
                                e = Math.atan2(this.target.x, this.target.z);
                                a.rotation.set(0, e, 0)
                            }
                        }
                    } else if (b === "rot") THREE.Quaternion.slerp(c, f, a.quaternion, e);
                    else if (b === "scl") {
                        b = a.scale;
                        b.x = c[0] + (f[0] - c[0]) * e;
                        b.y = c[1] + (f[1] - c[1]) * e;
                        b.z = c[2] + (f[2] - c[2]) * e
                    }
                }
            }
        }
        if (this.JITCompile && k[0][l] === undefined) {
            this.hierarchy[0].update(undefined, !0);
            for (o = 0; o < this.hierarchy.length; o++) k[o][l] = this.hierarchy[o] instanceof THREE.Bone ? this.hierarchy[o].skinMatrix.clone() : this.hierarchy[o].matrix.clone()
        }
    }
};
THREE.Animation.prototype.interpolateCatmullRom = function(a, d) {
    var b = [],
        e = [],
        c, f, g, h, j, l;
    c = (a.length - 1) * d;
    f = Math.floor(c);
    c -= f;
    b[0] = f == 0 ? f : f - 1;
    b[1] = f;
    b[2] = f > a.length - 2 ? f : f + 1;
    b[3] = f > a.length - 3 ? f : f + 2;
    f = a[b[0]];
    h = a[b[1]];
    j = a[b[2]];
    l = a[b[3]];
    b = c * c;
    g = c * b;
    e[0] = this.interpolate(f[0], h[0], j[0], l[0], c, b, g);
    e[1] = this.interpolate(f[1], h[1], j[1], l[1], c, b, g);
    e[2] = this.interpolate(f[2], h[2], j[2], l[2], c, b, g);
    return e
};
THREE.Animation.prototype.interpolate = function(a, d, b, e, c, f, g) {
    a = (b - a) * 0.5;
    e = (e - d) * 0.5;
    return (2 * (d - b) + a + e) * g + (-3 * (d - b) - 2 * a - e) * f + a * c + d
};
THREE.Animation.prototype.getNextKeyWith = function(a, d, b) {
    var e = this.data.hierarchy[d].keys;
    if (this.interpolationType === THREE.AnimationHandler.CATMULLROM || this.interpolationType === THREE.AnimationHandler.CATMULLROM_FORWARD) b = b < e.length - 1 ? b : e.length - 1;
    else b %= e.length;
    for (; b < e.length; b++)
        if (e[b][a] !== undefined) return e[b];
    return this.data.hierarchy[d].keys[0]
};
THREE.Animation.prototype.getPrevKeyWith = function(a, d, b) {
    var e = this.data.hierarchy[d].keys;
    for (b = this.interpolationType === THREE.AnimationHandler.CATMULLROM || this.interpolationType === THREE.AnimationHandler.CATMULLROM_FORWARD ? b > 0 ? b : 0 : b >= 0 ? b : b + e.length; b >= 0; b--)
        if (e[b][a] !== undefined) return e[b];
    return this.data.hierarchy[d].keys[e.length - 1]
};
var GeometryUtils = {
    merge: function(a, d) {
        var b = d instanceof THREE.Mesh,
            e = a.vertices.length,
            c = b ? d.geometry : d,
            f = a.vertices,
            g = c.vertices,
            h = a.faces,
            j = c.faces,
            l = a.faceVertexUvs[0];
        c = c.faceVertexUvs[0];
        b && d.matrixAutoUpdate && d.updateMatrix();
        for (var k = 0, m = g.length; k < m; k++) {
            var p = new THREE.Vertex(g[k].position.clone());
            b && d.matrix.multiplyVector3(p.position);
            f.push(p)
        }
        k = 0;
        for (m = j.length; k < m; k++) {
            g = j[k];
            var o, x, w = g.vertexNormals;
            p = g.vertexColors;
            if (g instanceof THREE.Face3) o = new THREE.Face3(g.a + e, g.b + e, g.c +
                e);
            else g instanceof THREE.Face4 && (o = new THREE.Face4(g.a + e, g.b + e, g.c + e, g.d + e));
            o.normal.copy(g.normal);
            b = 0;
            for (f = w.length; b < f; b++) {
                x = w[b];
                o.vertexNormals.push(x.clone())
            }
            o.color.copy(g.color);
            b = 0;
            for (f = p.length; b < f; b++) {
                x = p[b];
                o.vertexColors.push(x.clone())
            }
            o.materials = g.materials.slice();
            o.centroid.copy(g.centroid);
            h.push(o)
        }
        k = 0;
        for (m = c.length; k < m; k++) {
            e = c[k];
            h = [];
            b = 0;
            for (f = e.length; b < f; b++) h.push(new THREE.UV(e[b].u, e[b].v));
            l.push(h)
        }
    }
};
THREE.ImageUtils = {
    loadTexture: function(a, d, b) {
        var e = new Image,
            c = new THREE.Texture(e, d);
        e.onload = function() {
            c.needsUpdate = !0;
            b && b(this)
        };
        e.src = a;
        return c
    },
    loadTextureCube: function(a, d, b) {
        var e, c = [],
            f = new THREE.Texture(c, d);
        d = c.loadCount = 0;
        for (e = a.length; d < e; ++d) {
            c[d] = new Image;
            c[d].onload = function() {
                c.loadCount += 1;
                if (c.loadCount == 6) f.needsUpdate = !0;
                b && b(this)
            };
            c[d].src = a[d]
        }
        return f
    }
};
THREE.SceneUtils = {
    addMesh: function(a, d, b, e, c, f, g, h, j, l) {
        d = new THREE.Mesh(d, l);
        d.scale.x = d.scale.y = d.scale.z = b;
        d.position.x = e;
        d.position.y = c;
        d.position.z = f;
        d.rotation.x = g;
        d.rotation.y = h;
        d.rotation.z = j;
        a.addObject(d);
        return d
    },
    addPanoramaCubeWebGL: function(a, d, b) {
        var e = THREE.ShaderUtils.lib.cube;
        e.uniforms.tCube.texture = b;
        b = new THREE.MeshShaderMaterial({
            fragmentShader: e.fragmentShader,
            vertexShader: e.vertexShader,
            uniforms: e.uniforms
        });
        d = new THREE.Mesh(new THREE.Cube(d, d, d, 1, 1, 1, null, !0), b);
        a.addObject(d);
        return d
    },
    addPanoramaCube: function(a, d, b) {
        var e = [];
        e.push(new THREE.MeshBasicMaterial({
            map: new THREE.Texture(b[0])
        }));
        e.push(new THREE.MeshBasicMaterial({
            map: new THREE.Texture(b[1])
        }));
        e.push(new THREE.MeshBasicMaterial({
            map: new THREE.Texture(b[2])
        }));
        e.push(new THREE.MeshBasicMaterial({
            map: new THREE.Texture(b[3])
        }));
        e.push(new THREE.MeshBasicMaterial({
            map: new THREE.Texture(b[4])
        }));
        e.push(new THREE.MeshBasicMaterial({
            map: new THREE.Texture(b[5])
        }));
        d = new THREE.Mesh(new THREE.Cube(d, d, d, 1, 1, e, !0), new THREE.MeshFaceMaterial);
        a.addObject(d);
        return d
    },
    addPanoramaCubePlanes: function(a, d, b) {
        var e = d / 2;
        d = new THREE.Plane(d, d);
        var c = Math.PI,
            f = Math.PI / 2;
        THREE.SceneUtils.addMesh(a, d, 1, 0, 0, -e, 0, 0, 0, new THREE.MeshBasicMaterial({
            map: new THREE.Texture(b[5])
        }));
        THREE.SceneUtils.addMesh(a, d, 1, -e, 0, 0, 0, f, 0, new THREE.MeshBasicMaterial({
            map: new THREE.Texture(b[0])
        }));
        THREE.SceneUtils.addMesh(a, d, 1, e, 0, 0, 0, -f, 0, new THREE.MeshBasicMaterial({
            map: new THREE.Texture(b[1])
        }));
        THREE.SceneUtils.addMesh(a, d, 1, 0, e, 0, f, 0, c, new THREE.MeshBasicMaterial({
            map: new THREE.Texture(b[2])
        }));
        THREE.SceneUtils.addMesh(a, d, 1, 0, -e, 0, -f, 0, c, new THREE.MeshBasicMaterial({
            map: new THREE.Texture(b[3])
        }))
    },
    showHierarchy: function(a, d) {
        THREE.SceneUtils.traverseHierarchy(a, function(b) {
            b.visible = d
        })
    },
    traverseHierarchy: function(a, d) {
        var b, e, c = a.children.length;
        for (e = 0; e < c; e++) {
            b = a.children[e];
            d(b);
            THREE.SceneUtils.traverseHierarchy(b, d)
        }
    }
};
THREE.ShaderUtils = {
    lib: {
        fresnel: {
            uniforms: {
                mRefractionRatio: {
                    type: "f",
                    value: 1.02
                },
                mFresnelBias: {
                    type: "f",
                    value: 0.1
                },
                mFresnelPower: {
                    type: "f",
                    value: 2
                },
                mFresnelScale: {
                    type: "f",
                    value: 1
                },
                tCube: {
                    type: "t",
                    value: 1,
                    texture: null
                }
            },
            fragmentShader: "uniform samplerCube tCube;\nvarying vec3 vReflect;\nvarying vec3 vRefract[3];\nvarying float vReflectionFactor;\nvoid main() {\nvec4 reflectedColor = textureCube( tCube, vec3( -vReflect.x, vReflect.yz ) );\nvec4 refractedColor = vec4( 1.0, 1.0, 1.0, 1.0 );\nrefractedColor.r = textureCube( tCube, vec3( -vRefract[0].x, vRefract[0].yz ) ).r;\nrefractedColor.g = textureCube( tCube, vec3( -vRefract[1].x, vRefract[1].yz ) ).g;\nrefractedColor.b = textureCube( tCube, vec3( -vRefract[2].x, vRefract[2].yz ) ).b;\nrefractedColor.a = 1.0;\ngl_FragColor = mix( refractedColor, reflectedColor, clamp( vReflectionFactor, 0.0, 1.0 ) );\n}",
            vertexShader: "uniform float mRefractionRatio;\nuniform float mFresnelBias;\nuniform float mFresnelScale;\nuniform float mFresnelPower;\nvarying vec3 vReflect;\nvarying vec3 vRefract[3];\nvarying float vReflectionFactor;\nvoid main() {\nvec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\nvec4 mPosition = objectMatrix * vec4( position, 1.0 );\nvec3 nWorld = normalize ( mat3( objectMatrix[0].xyz, objectMatrix[1].xyz, objectMatrix[2].xyz ) * normal );\nvec3 I = mPosition.xyz - cameraPosition;\nvReflect = reflect( I, nWorld );\nvRefract[0] = refract( normalize( I ), nWorld, mRefractionRatio );\nvRefract[1] = refract( normalize( I ), nWorld, mRefractionRatio * 0.99 );\nvRefract[2] = refract( normalize( I ), nWorld, mRefractionRatio * 0.98 );\nvReflectionFactor = mFresnelBias + mFresnelScale * pow( 1.0 + dot( normalize( I ), nWorld ), mFresnelPower );\ngl_Position = projectionMatrix * mvPosition;\n}"
        },
        normal: {
            uniforms: {
                enableAO: {
                    type: "i",
                    value: 0
                },
                enableDiffuse: {
                    type: "i",
                    value: 0
                },
                enableSpecular: {
                    type: "i",
                    value: 0
                },
                tDiffuse: {
                    type: "t",
                    value: 0,
                    texture: null
                },
                tNormal: {
                    type: "t",
                    value: 2,
                    texture: null
                },
                tSpecular: {
                    type: "t",
                    value: 3,
                    texture: null
                },
                tAO: {
                    type: "t",
                    value: 4,
                    texture: null
                },
                uNormalScale: {
                    type: "f",
                    value: 1
                },
                tDisplacement: {
                    type: "t",
                    value: 5,
                    texture: null
                },
                uDisplacementBias: {
                    type: "f",
                    value: -0.5
                },
                uDisplacementScale: {
                    type: "f",
                    value: 2.5
                },
                uPointLightPos: {
                    type: "v3",
                    value: new THREE.Vector3
                },
                uPointLightColor: {
                    type: "c",
                    value: new THREE.Color(15658734)
                },
                uDirLightPos: {
                    type: "v3",
                    value: new THREE.Vector3
                },
                uDirLightColor: {
                    type: "c",
                    value: new THREE.Color(15658734)
                },
                uAmbientLightColor: {
                    type: "c",
                    value: new THREE.Color(328965)
                },
                uDiffuseColor: {
                    type: "c",
                    value: new THREE.Color(15658734)
                },
                uSpecularColor: {
                    type: "c",
                    value: new THREE.Color(1118481)
                },
                uAmbientColor: {
                    type: "c",
                    value: new THREE.Color(328965)
                },
                uShininess: {
                    type: "f",
                    value: 30
                }
            },
            fragmentShader: "uniform vec3 uDirLightPos;\nuniform vec3 uAmbientLightColor;\nuniform vec3 uDirLightColor;\nuniform vec3 uPointLightColor;\nuniform vec3 uAmbientColor;\nuniform vec3 uDiffuseColor;\nuniform vec3 uSpecularColor;\nuniform float uShininess;\nuniform bool enableDiffuse;\nuniform bool enableSpecular;\nuniform bool enableAO;\nuniform sampler2D tDiffuse;\nuniform sampler2D tNormal;\nuniform sampler2D tSpecular;\nuniform sampler2D tAO;\nuniform float uNormalScale;\nvarying vec3 vTangent;\nvarying vec3 vBinormal;\nvarying vec3 vNormal;\nvarying vec2 vUv;\nvarying vec3 vPointLightVector;\nvarying vec3 vViewPosition;\nvoid main() {\nvec3 diffuseTex = vec3( 1.0, 1.0, 1.0 );\nvec3 aoTex = vec3( 1.0, 1.0, 1.0 );\nvec3 specularTex = vec3( 1.0, 1.0, 1.0 );\nvec3 normalTex = texture2D( tNormal, vUv ).xyz * 2.0 - 1.0;\nnormalTex.xy *= uNormalScale;\nnormalTex = normalize( normalTex );\nif( enableDiffuse )\ndiffuseTex = texture2D( tDiffuse, vUv ).xyz;\nif( enableAO )\naoTex = texture2D( tAO, vUv ).xyz;\nif( enableSpecular )\nspecularTex = texture2D( tSpecular, vUv ).xyz;\nmat3 tsb = mat3( vTangent, vBinormal, vNormal );\nvec3 finalNormal = tsb * normalTex;\nvec3 normal = normalize( finalNormal );\nvec3 viewPosition = normalize( vViewPosition );\nvec4 pointDiffuse  = vec4( 0.0, 0.0, 0.0, 0.0 );\nvec4 pointSpecular = vec4( 0.0, 0.0, 0.0, 0.0 );\nvec3 pointVector = normalize( vPointLightVector );\nvec3 pointHalfVector = normalize( vPointLightVector + vViewPosition );\nfloat pointDotNormalHalf = dot( normal, pointHalfVector );\nfloat pointDiffuseWeight = max( dot( normal, pointVector ), 0.0 );\nfloat pointSpecularWeight = 0.0;\nif ( pointDotNormalHalf >= 0.0 )\npointSpecularWeight = specularTex.r * pow( pointDotNormalHalf, uShininess );\npointDiffuse  += vec4( uDiffuseColor, 1.0 ) * pointDiffuseWeight;\npointSpecular += vec4( uSpecularColor, 1.0 ) * pointSpecularWeight * pointDiffuseWeight;\nvec4 dirDiffuse  = vec4( 0.0, 0.0, 0.0, 0.0 );\nvec4 dirSpecular = vec4( 0.0, 0.0, 0.0, 0.0 );\nvec4 lDirection = viewMatrix * vec4( uDirLightPos, 0.0 );\nvec3 dirVector = normalize( lDirection.xyz );\nvec3 dirHalfVector = normalize( lDirection.xyz + vViewPosition );\nfloat dirDotNormalHalf = dot( normal, dirHalfVector );\nfloat dirDiffuseWeight = max( dot( normal, dirVector ), 0.0 );\nfloat dirSpecularWeight = 0.0;\nif ( dirDotNormalHalf >= 0.0 )\ndirSpecularWeight = specularTex.r * pow( dirDotNormalHalf, uShininess );\ndirDiffuse  += vec4( uDiffuseColor, 1.0 ) * dirDiffuseWeight;\ndirSpecular += vec4( uSpecularColor, 1.0 ) * dirSpecularWeight * dirDiffuseWeight;\nvec4 totalLight = vec4( uAmbientLightColor * uAmbientColor, 1.0 );\ntotalLight += vec4( uDirLightColor, 1.0 ) * ( dirDiffuse + dirSpecular );\ntotalLight += vec4( uPointLightColor, 1.0 ) * ( pointDiffuse + pointSpecular );\ngl_FragColor = vec4( totalLight.xyz * aoTex * diffuseTex, 1.0 );\n}",
            vertexShader: "attribute vec4 tangent;\nuniform vec3 uPointLightPos;\n#ifdef VERTEX_TEXTURES\nuniform sampler2D tDisplacement;\nuniform float uDisplacementScale;\nuniform float uDisplacementBias;\n#endif\nvarying vec3 vTangent;\nvarying vec3 vBinormal;\nvarying vec3 vNormal;\nvarying vec2 vUv;\nvarying vec3 vPointLightVector;\nvarying vec3 vViewPosition;\nvoid main() {\nvec4 mPosition = objectMatrix * vec4( position, 1.0 );\nvViewPosition = cameraPosition - mPosition.xyz;\nvec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\nvNormal = normalize( normalMatrix * normal );\nvTangent = normalize( normalMatrix * tangent.xyz );\nvBinormal = cross( vNormal, vTangent ) * tangent.w;\nvBinormal = normalize( vBinormal );\nvUv = uv;\nvec4 lPosition = viewMatrix * vec4( uPointLightPos, 1.0 );\nvPointLightVector = normalize( lPosition.xyz - mvPosition.xyz );\n#ifdef VERTEX_TEXTURES\nvec3 dv = texture2D( tDisplacement, uv ).xyz;\nfloat df = uDisplacementScale * dv.x + uDisplacementBias;\nvec4 displacedPosition = vec4( vNormal.xyz * df, 0.0 ) + mvPosition;\ngl_Position = projectionMatrix * displacedPosition;\n#else\ngl_Position = projectionMatrix * mvPosition;\n#endif\n}"
        },
        cube: {
            uniforms: {
                tCube: {
                    type: "t",
                    value: 1,
                    texture: null
                }
            },
            vertexShader: "varying vec3 vViewPosition;\nvoid main() {\nvec4 mPosition = objectMatrix * vec4( position, 1.0 );\nvViewPosition = cameraPosition - mPosition.xyz;\ngl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}",
            fragmentShader: "uniform samplerCube tCube;\nvarying vec3 vViewPosition;\nvoid main() {\nvec3 wPos = cameraPosition - vViewPosition;\ngl_FragColor = textureCube( tCube, vec3( - wPos.x, wPos.yz ) );\n}"
        },
        convolution: {
            uniforms: {
                tDiffuse: {
                    type: "t",
                    value: 0,
                    texture: null
                },
                uImageIncrement: {
                    type: "v2",
                    value: new THREE.Vector2(0.001953125, 0)
                },
                cKernel: {
                    type: "fv1",
                    value: []
                }
            },
            vertexShader: "varying vec2 vUv;\nuniform vec2 uImageIncrement;\nvoid main(void) {\nvUv = uv - ((KERNEL_SIZE - 1.0) / 2.0) * uImageIncrement;\ngl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}",
            fragmentShader: "varying vec2 vUv;\nuniform sampler2D tDiffuse;\nuniform vec2 uImageIncrement;\nuniform float cKernel[KERNEL_SIZE];\nvoid main(void) {\nvec2 imageCoord = vUv;\nvec4 sum = vec4( 0.0, 0.0, 0.0, 0.0 );\nfor( int i=0; i<KERNEL_SIZE; ++i ) {\nsum += texture2D( tDiffuse, imageCoord ) * cKernel[i];\nimageCoord += uImageIncrement;\n}\ngl_FragColor = sum;\n}"
        },
        film: {
            uniforms: {
                tDiffuse: {
                    type: "t",
                    value: 0,
                    texture: null
                },
                time: {
                    type: "f",
                    value: 0
                },
                nIntensity: {
                    type: "f",
                    value: 0.5
                },
                sIntensity: {
                    type: "f",
                    value: 0.05
                },
                sCount: {
                    type: "f",
                    value: 4096
                },
                grayscale: {
                    type: "i",
                    value: 1
                }
            },
            vertexShader: "varying vec2 vUv;\nvoid main() {\nvUv = vec2( uv.x, 1.0 - uv.y );\ngl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}",
            fragmentShader: "varying vec2 vUv;\nuniform sampler2D tDiffuse;\nuniform float time;\nuniform bool grayscale;\nuniform float nIntensity;\nuniform float sIntensity;\nuniform float sCount;\nvoid main() {\nvec4 cTextureScreen = texture2D( tDiffuse, vUv );\nfloat x = vUv.x * vUv.y * time *  1000.0;\nx = mod( x, 13.0 ) * mod( x, 123.0 );\nfloat dx = mod( x, 0.01 );\nvec3 cResult = cTextureScreen.rgb + cTextureScreen.rgb * clamp( 0.1 + dx * 100.0, 0.0, 1.0 );\nvec2 sc = vec2( sin( vUv.y * sCount ), cos( vUv.y * sCount ) );\ncResult += cTextureScreen.rgb * vec3( sc.x, sc.y, sc.x ) * sIntensity;\ncResult = cTextureScreen.rgb + clamp( nIntensity, 0.0,1.0 ) * ( cResult - cTextureScreen.rgb );\nif( grayscale ) {\ncResult = vec3( cResult.r * 0.3 + cResult.g * 0.59 + cResult.b * 0.11 );\n}\ngl_FragColor =  vec4( cResult, cTextureScreen.a );\n}"
        },
        screen: {
            uniforms: {
                tDiffuse: {
                    type: "t",
                    value: 0,
                    texture: null
                },
                opacity: {
                    type: "f",
                    value: 1
                }
            },
            vertexShader: "varying vec2 vUv;\nvoid main() {\nvUv = vec2( uv.x, 1.0 - uv.y );\ngl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}",
            fragmentShader: "varying vec2 vUv;\nuniform sampler2D tDiffuse;\nuniform float opacity;\nvoid main() {\nvec4 texel = texture2D( tDiffuse, vUv );\ngl_FragColor = opacity * texel;\n}"
        },
        basic: {
            uniforms: {},
            vertexShader: "void main() {\ngl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}",
            fragmentShader: "void main() {\ngl_FragColor = vec4( 1.0, 0.0, 0.0, 0.5 );\n}"
        }
    },
    buildKernel: function(a) {
        var d, b, e, c, f = 2 * Math.ceil(a * 3) + 1;
        f > 25 && (f = 25);
        c = (f - 1) * 0.5;
        b = Array(f);
        for (d = e = 0; d < f; ++d) {
            b[d] = Math.exp(-((d - c) * (d - c)) / (2 * a * a));
            e += b[d]
        }
        for (d = 0; d < f; ++d) b[d] /= e;
        return b
    }
};
THREE.QuakeCamera = function(a) {
    function d(b, e) {
        return function() {
            e.apply(b, arguments)
        }
    }
    THREE.Camera.call(this, a.fov, a.aspect, a.near, a.far, a.target);
    this.movementSpeed = 1;
    this.lookSpeed = 0.0050;
    this.noFly = !1;
    this.lookVertical = !0;
    this.autoForward = !1;
    this.activeLook = !0;
    this.heightSpeed = !1;
    this.heightCoef = 1;
    this.heightMin = 0;
    this.constrainVertical = !1;
    this.verticalMin = 0;
    this.verticalMax = 3.14;
    this.domElement = document;
    if (a) {
        if (a.movementSpeed !== undefined) this.movementSpeed = a.movementSpeed;
        if (a.lookSpeed !== undefined) this.lookSpeed = a.lookSpeed;
        if (a.noFly !== undefined) this.noFly = a.noFly;
        if (a.lookVertical !== undefined) this.lookVertical = a.lookVertical;
        if (a.autoForward !== undefined) this.autoForward = a.autoForward;
        if (a.activeLook !== undefined) this.activeLook = a.activeLook;
        if (a.heightSpeed !== undefined) this.heightSpeed = a.heightSpeed;
        if (a.heightCoef !== undefined) this.heightCoef = a.heightCoef;
        if (a.heightMin !== undefined) this.heightMin = a.heightMin;
        if (a.heightMax !== undefined) this.heightMax = a.heightMax;
        if (a.constrainVertical !== undefined) this.constrainVertical = a.constrainVertical;
        if (a.verticalMin !== undefined) this.verticalMin = a.verticalMin;
        if (a.verticalMax !== undefined) this.verticalMax = a.verticalMax;
        if (a.domElement !== undefined) this.domElement = a.domElement
    }
    this.theta = this.phi = this.lon = this.lat = this.mouseY = this.mouseX = this.autoSpeedFactor = 0;
    this.moveForward = !1;
    this.moveBackward = !1;
    this.moveLeft = !1;
    this.moveRight = !1;
    this.freeze = !1;
    this.mouseDragOn = !1;
    this.windowHalfX = window.innerWidth / 2;
    this.windowHalfY = window.innerHeight / 2;
    this.onMouseDown = function(b) {
        b.preventDefault();
        b.stopPropagation();
        if (this.activeLook) switch (b.button) {
            case 0:
                this.moveForward = !0;
                break;
            case 2:
                this.moveBackward = !0
        }
        this.mouseDragOn = !0
    };
    this.onMouseUp = function(b) {
        b.preventDefault();
        b.stopPropagation();
        if (this.activeLook) switch (b.button) {
            case 0:
                this.moveForward = !1;
                break;
            case 2:
                this.moveBackward = !1
        }
        this.mouseDragOn = !1
    };
    this.onMouseMove = function(b) {
        this.mouseX = b.clientX - this.windowHalfX;
        this.mouseY = b.clientY - this.windowHalfY
    };
    this.onKeyDown = function(b) {
        switch (b.keyCode) {
            case 38:
            case 87:
                this.moveForward = !0;
                break;
            case 37:
            case 65:
                this.moveLeft = !0;
                break;
            case 40:
            case 83:
                this.moveBackward = !0;
                break;
            case 39:
            case 68:
                this.moveRight = !0;
                break;
            case 81:
                this.freeze = !this.freeze
        }
    };
    this.onKeyUp = function(b) {
        switch (b.keyCode) {
            case 38:
            case 87:
                this.moveForward = !1;
                break;
            case 37:
            case 65:
                this.moveLeft = !1;
                break;
            case 40:
            case 83:
                this.moveBackward = !1;
                break;
            case 39:
            case 68:
                this.moveRight = !1
        }
    };
    this.update = function() {
        if (!this.freeze) {
            this.autoSpeedFactor = this.heightSpeed ? ((this.position.y < this.heightMin ? this.heightMin : this.position.y > this.heightMax ? this.heightMax : this.position.y) - this.heightMin) * this.heightCoef : 0;
            (this.moveForward || this.autoForward && !this.moveBackward) && this.translateZ(-(this.movementSpeed + this.autoSpeedFactor));
            this.moveBackward && this.translateZ(this.movementSpeed);
            this.moveLeft && this.translateX(-this.movementSpeed);
            this.moveRight && this.translateX(this.movementSpeed);
            var b = this.lookSpeed;
            this.activeLook || (b = 0);
            this.lon += this.mouseX * b;
            this.lookVertical && (this.lat -= this.mouseY * b);
            this.lat = Math.max(-85, Math.min(85, this.lat));
            this.phi = (90 - this.lat) * Math.PI / 180;
            this.theta = this.lon * Math.PI / 180;
            var e = this.target.position,
                c = this.position;
            e.x = c.x + 100 * Math.sin(this.phi) * Math.cos(this.theta);
            e.y = c.y + 100 * Math.cos(this.phi);
            e.z = c.z + 100 * Math.sin(this.phi) * Math.sin(this.theta)
        }
        this.lon += this.mouseX * b;
        this.lookVertical && (this.lat -= this.mouseY * b);
        this.lat = Math.max(-85, Math.min(85, this.lat));
        this.phi = (90 - this.lat) * Math.PI / 180;
        this.theta = this.lon * Math.PI / 180;
        if (this.constrainVertical) this.phi = (this.phi - 0) * (this.verticalMax -
            this.verticalMin) / 3.14 + this.verticalMin;
        e = this.target.position;
        c = this.position;
        e.x = c.x + 100 * Math.sin(this.phi) * Math.cos(this.theta);
        e.y = c.y + 100 * Math.cos(this.phi);
        e.z = c.z + 100 * Math.sin(this.phi) * Math.sin(this.theta);
        this.supr.update.call(this)
    };
    this.domElement.addEventListener("contextmenu", function(b) {
        b.preventDefault()
    }, !1);
    this.domElement.addEventListener("mousemove", d(this, this.onMouseMove), !1);
    this.domElement.addEventListener("mousedown", d(this, this.onMouseDown), !1);
    this.domElement.addEventListener("mouseup", d(this, this.onMouseUp), !1);
    this.domElement.addEventListener("keydown", d(this, this.onKeyDown), !1);
    this.domElement.addEventListener("keyup", d(this, this.onKeyUp), !1)
};
THREE.QuakeCamera.prototype = new THREE.Camera;
THREE.QuakeCamera.prototype.constructor = THREE.QuakeCamera;
THREE.QuakeCamera.prototype.supr = THREE.Camera.prototype;
THREE.QuakeCamera.prototype.translate = function(a, d) {
    this.matrix.rotateAxis(d);
    if (this.noFly) d.y = 0;
    this.position.addSelf(d.multiplyScalar(a));
    this.target.position.addSelf(d.multiplyScalar(a))
};
THREE.PathCamera = function(a) {
    function d(l, k, m, p) {
        var o = {
                name: m,
                fps: 0.6,
                length: p,
                hierarchy: []
            },
            x, w = k.getControlPointsArray(),
            u = k.getLength(),
            B = w.length,
            z = 0;
        x = B - 1;
        k = {
            parent: -1,
            keys: []
        };
        k.keys[0] = {
            time: 0,
            pos: w[0],
            rot: [0, 0, 0, 1],
            scl: [1, 1, 1]
        };
        k.keys[x] = {
            time: p,
            pos: w[x],
            rot: [0, 0, 0, 1],
            scl: [1, 1, 1]
        };
        for (x = 1; x < B - 1; x++) {
            z = p * u.chunks[x] / u.total;
            k.keys[x] = {
                time: z,
                pos: w[x]
            }
        }
        o.hierarchy[0] = k;
        THREE.AnimationHandler.add(o);
        return new THREE.Animation(l, m, THREE.AnimationHandler.CATMULLROM_FORWARD, !1)
    }

    function b(l, k) {
        var m, p, o = new THREE.Geometry;
        for (m = 0; m < l.points.length * k; m++) {
            p = m / (l.points.length * k);
            p = l.getPoint(p);
            o.vertices[m] = new THREE.Vertex(new THREE.Vector3(p.x, p.y, p.z))
        }
        return o
    }

    function e(l, k) {
        var m = b(k, 10),
            p = b(k, 10),
            o = new THREE.LineBasicMaterial({
                color: 16711680,
                linewidth: 3
            });
        lineObj = new THREE.Line(m, o);
        particleObj = new THREE.ParticleSystem(p, new THREE.ParticleBasicMaterial({
            color: 16755200,
            size: 3
        }));
        lineObj.scale.set(1, 1, 1);
        l.addChild(lineObj);
        particleObj.scale.set(1, 1, 1);
        l.addChild(particleObj);
        p = new Sphere(1, 16, 8);
        o = new THREE.MeshBasicMaterial({
            color: 65280
        });
        for (i = 0; i < k.points.length; i++) {
            m = new THREE.Mesh(p, o);
            m.position.copy(k.points[i]);
            m.updateMatrix();
            l.addChild(m)
        }
    }
    THREE.Camera.call(this, a.fov, a.aspect, a.near, a.far, a.target);
    this.id = "PathCamera" + THREE.PathCameraIdCounter++;
    this.duration = 1E4;
    this.waypoints = [];
    this.useConstantSpeed = !0;
    this.resamplingCoef = 50;
    this.debugPath = new THREE.Object3D;
    this.debugDummy = new THREE.Object3D;
    this.animationParent = new THREE.Object3D;
    this.lookSpeed = 0.0050;
    this.lookVertical = !0;
    this.lookHorizontal = !0;
    this.verticalAngleMap = {
        srcRange: [0, 6.28],
        dstRange: [0, 6.28]
    };
    this.horizontalAngleMap = {
        srcRange: [0, 6.28],
        dstRange: [0, 6.28]
    };
    this.domElement = document;
    if (a) {
        if (a.duration !== undefined) this.duration = a.duration * 1E3;
        if (a.waypoints !== undefined) this.waypoints = a.waypoints;
        if (a.useConstantSpeed !== undefined) this.useConstantSpeed = a.useConstantSpeed;
        if (a.resamplingCoef !== undefined) this.resamplingCoef = a.resamplingCoef;
        if (a.createDebugPath !== undefined) this.createDebugPath = a.createDebugPath;
        if (a.createDebugDummy !== undefined) this.createDebugDummy = a.createDebugDummy;
        if (a.lookSpeed !== undefined) this.lookSpeed = a.lookSpeed;
        if (a.lookVertical !== undefined) this.lookVertical = a.lookVertical;
        if (a.lookHorizontal !== undefined) this.lookHorizontal = a.lookHorizontal;
        if (a.verticalAngleMap !== undefined) this.verticalAngleMap = a.verticalAngleMap;
        if (a.horizontalAngleMap !== undefined) this.horizontalAngleMap = a.horizontalAngleMap;
        if (a.domElement !== undefined) this.domElement = a.domElement
    }
    this.theta = this.phi = this.lon = this.lat = this.mouseY = this.mouseX = 0;
    this.windowHalfX = window.innerWidth / 2;
    this.windowHalfY = window.innerHeight / 2;
    var c = Math.PI * 2,
        f = Math.PI / 180;
    this.update = function(l, k, m) {
        var p, o;
        this.lookHorizontal && (this.lon += this.mouseX * this.lookSpeed);
        this.lookVertical && (this.lat -= this.mouseY * this.lookSpeed);
        this.lon = Math.max(0, Math.min(360, this.lon));
        this.lat = Math.max(-85, Math.min(85, this.lat));
        this.phi = (90 - this.lat) * f;
        this.theta = this.lon * f;
        p = this.phi % c;
        this.phi = p >= 0 ? p : p + c;
        p = this.verticalAngleMap.srcRange;
        o = this.verticalAngleMap.dstRange;
        this.phi = (this.phi - p[0]) * (o[1] - o[0]) / (p[1] - p[0]) + o[0];
        p = this.horizontalAngleMap.srcRange;
        o = this.horizontalAngleMap.dstRange;
        this.theta = (this.theta - p[0]) * (o[1] - o[0]) / (p[1] - p[0]) + o[0];
        p = this.target.position;
        p.x = 100 * Math.sin(this.phi) * Math.cos(this.theta);
        p.y = 100 * Math.cos(this.phi);
        p.z = 100 * Math.sin(this.phi) * Math.sin(this.theta);
        this.supr.update.call(this, l, k, m)
    };
    this.onMouseMove = function(l) {
        this.mouseX = l.clientX - this.windowHalfX;
        this.mouseY = l.clientY - this.windowHalfY
    };
    this.spline = new THREE.Spline;
    this.spline.initFromArray(this.waypoints);
    this.useConstantSpeed && this.spline.reparametrizeByArcLength(this.resamplingCoef);
    if (this.createDebugDummy) {
        a = new THREE.MeshLambertMaterial({
            color: 30719
        });
        var g = new THREE.MeshLambertMaterial({
                color: 65280
            }),
            h = new THREE.Cube(10, 10, 20),
            j = new THREE.Cube(2, 2, 10);
        this.animationParent = new THREE.Mesh(h, a);
        a = new THREE.Mesh(j, g);
        a.position.set(0, 10, 0);
        this.animation = d(this.animationParent, this.spline, this.id, this.duration);
        this.animationParent.addChild(this);
        this.animationParent.addChild(this.target);
        this.animationParent.addChild(a)
    } else {
        this.animation = d(this.animationParent, this.spline, this.id, this.duration);
        this.animationParent.addChild(this.target);
        this.animationParent.addChild(this)
    }
    this.createDebugPath && e(this.debugPath, this.spline);
    this.domElement.addEventListener("mousemove", function(l, k) {
        return function() {
            k.apply(l, arguments)
        }
    }(this, this.onMouseMove), !1)
};
THREE.PathCamera.prototype = new THREE.Camera;
THREE.PathCamera.prototype.constructor = THREE.PathCamera;
THREE.PathCamera.prototype.supr = THREE.Camera.prototype;
THREE.PathCameraIdCounter = 0;
THREE.FlyCamera = function(a) {
    function d(b, e) {
        return function() {
            e.apply(b, arguments)
        }
    }
    THREE.Camera.call(this, a.fov, a.aspect, a.near, a.far, a.target);
    this.tmpQuaternion = new THREE.Quaternion;
    this.tdiff = 0;
    this.movementSpeed = 1;
    this.rollSpeed = 0.0050;
    this.dragToLook = !1;
    this.autoForward = !1;
    this.domElement = document;
    if (a) {
        if (a.movementSpeed !== undefined) this.movementSpeed = a.movementSpeed;
        if (a.rollSpeed !== undefined) this.rollSpeed = a.rollSpeed;
        if (a.dragToLook !== undefined) this.dragToLook = a.dragToLook;
        if (a.autoForward !== undefined) this.autoForward = a.autoForward;
        if (a.domElement !== undefined) this.domElement = a.domElement
    }
    this.useTarget = !1;
    this.useQuaternion = !0;
    this.mouseStatus = 0;
    this.moveState = {
        up: 0,
        down: 0,
        left: 0,
        right: 0,
        forward: 0,
        back: 0,
        pitchUp: 0,
        pitchDown: 0,
        yawLeft: 0,
        yawRight: 0,
        rollLeft: 0,
        rollRight: 0
    };
    this.moveVector = new THREE.Vector3(0, 0, 0);
    this.rotationVector = new THREE.Vector3(0, 0, 0);
    this.lastUpdate = (new Date).getTime();
    this.handleEvent = function(b) {
        if (typeof this[b.type] == "function") this[b.type](b)
    };
    this.keydown = function(b) {
        if (!b.altKey) {
            switch (b.keyCode) {
                case 16:
                    this.movementSpeedMultiplier = 0.1;
                    break;
                case 87:
                    this.moveState.forward = 1;
                    break;
                case 83:
                    this.moveState.back = 1;
                    break;
                case 65:
                    this.moveState.left = 1;
                    break;
                case 68:
                    this.moveState.right = 1;
                    break;
                case 82:
                    this.moveState.up = 1;
                    break;
                case 70:
                    this.moveState.down = 1;
                    break;
                case 38:
                    this.moveState.pitchUp = 1;
                    break;
                case 40:
                    this.moveState.pitchDown = 1;
                    break;
                case 37:
                    this.moveState.yawLeft = 1;
                    break;
                case 39:
                    this.moveState.yawRight = 1;
                    break;
                case 81:
                    this.moveState.rollLeft = 1;
                    break;
                case 69:
                    this.moveState.rollRight = 1
            }
            this.updateMovementVector();
            this.updateRotationVector()
        }
    };
    this.keyup = function(b) {
        switch (b.keyCode) {
            case 16:
                this.movementSpeedMultiplier = 1;
                break;
            case 87:
                this.moveState.forward = 0;
                break;
            case 83:
                this.moveState.back = 0;
                break;
            case 65:
                this.moveState.left = 0;
                break;
            case 68:
                this.moveState.right = 0;
                break;
            case 82:
                this.moveState.up = 0;
                break;
            case 70:
                this.moveState.down = 0;
                break;
            case 38:
                this.moveState.pitchUp = 0;
                break;
            case 40:
                this.moveState.pitchDown = 0;
                break;
            case 37:
                this.moveState.yawLeft = 0;
                break;
            case 39:
                this.moveState.yawRight = 0;
                break;
            case 81:
                this.moveState.rollLeft = 0;
                break;
            case 69:
                this.moveState.rollRight = 0
        }
        this.updateMovementVector();
        this.updateRotationVector()
    };
    this.mousedown = function(b) {
        b.preventDefault();
        b.stopPropagation();
        if (this.dragToLook) this.mouseStatus++;
        else switch (b.button) {
            case 0:
                this.moveForward = !0;
                break;
            case 2:
                this.moveBackward = !0
        }
    };
    this.mousemove = function(b) {
        if (!this.dragToLook || this.mouseStatus > 0) {
            var e = this.getContainerDimensions(),
                c = e.size[0] / 2,
                f = e.size[1] / 2;
            this.moveState.yawLeft = -(b.clientX - e.offset[0] - c) / c;
            this.moveState.pitchDown = (b.clientY - e.offset[1] - f) / f;
            this.updateRotationVector()
        }
    };
    this.mouseup = function(b) {
        b.preventDefault();
        b.stopPropagation();
        if (this.dragToLook) {
            this.mouseStatus--;
            this.moveState.yawLeft = this.moveState.pitchDown = 0
        } else switch (b.button) {
            case 0:
                this.moveForward = !1;
                break;
            case 2:
                this.moveBackward = !1
        }
        this.updateRotationVector()
    };
    this.update = function() {
        var b = (new Date).getTime();
        this.tdiff = (b - this.lastUpdate) / 1E3;
        this.lastUpdate = b;
        b = this.tdiff * this.movementSpeed;
        var e = this.tdiff * this.rollSpeed;
        this.translateX(this.moveVector.x * b);
        this.translateY(this.moveVector.y * b);
        this.translateZ(this.moveVector.z * b);
        this.tmpQuaternion.set(this.rotationVector.x * e, this.rotationVector.y * e, this.rotationVector.z * e, 1).normalize();
        this.quaternion.multiplySelf(this.tmpQuaternion);
        this.matrix.setPosition(this.position);
        this.matrix.setRotationFromQuaternion(this.quaternion);
        this.matrixWorldNeedsUpdate = !0;
        this.supr.update.call(this)
    };
    this.updateMovementVector = function() {
        var b = this.moveState.forward || this.autoForward && !this.moveState.back ? 1 : 0;
        this.moveVector.x = -this.moveState.left + this.moveState.right;
        this.moveVector.y = -this.moveState.down + this.moveState.up;
        this.moveVector.z = -b + this.moveState.back
    };
    this.updateRotationVector = function() {
        this.rotationVector.x = -this.moveState.pitchDown + this.moveState.pitchUp;
        this.rotationVector.y = -this.moveState.yawRight + this.moveState.yawLeft;
        this.rotationVector.z = -this.moveState.rollRight + this.moveState.rollLeft
    };
    this.getContainerDimensions = function() {
        return this.domElement != document ? {
            size: [this.domElement.offsetWidth, this.domElement.offsetHeight],
            offset: [this.domElement.offsetLeft, this.domElement.offsetTop]
        } : {
            size: [window.innerWidth, window.innerHeight],
            offset: [0, 0]
        }
    };
    this.domElement.addEventListener("mousemove", d(this, this.mousemove), !1);
    this.domElement.addEventListener("mousedown", d(this, this.mousedown), !1);
    this.domElement.addEventListener("mouseup", d(this, this.mouseup), !1);
    window.addEventListener("keydown", d(this, this.keydown), !1);
    window.addEventListener("keyup", d(this, this.keyup), !1);
    this.updateMovementVector();
    this.updateRotationVector()
};
THREE.FlyCamera.prototype = new THREE.Camera;
THREE.FlyCamera.prototype.constructor = THREE.FlyCamera;
THREE.FlyCamera.prototype.supr = THREE.Camera.prototype;
THREE.Cube = function(a, d, b, e, c, f, g, h, j) {
    function l(u, B, z, n, y, C, G, K) {
        var J, I, E = e || 1,
            L = c || 1,
            P = y / 2,
            Q = C / 2,
            R = k.vertices.length;
        if (u == "x" && B == "y" || u == "y" && B == "x") J = "z";
        else if (u == "x" && B == "z" || u == "z" && B == "x") {
            J = "y";
            L = f || 1
        } else if (u == "z" && B == "y" || u == "y" && B == "z") {
            J = "x";
            E = f || 1
        }
        var M = E + 1,
            F = L + 1;
        y /= E;
        var N = C / L;
        for (I = 0; I < F; I++)
            for (C = 0; C < M; C++) {
                var O = new THREE.Vector3;
                O[u] = (C * y - P) * z;
                O[B] = (I * N - Q) * n;
                O[J] = G;
                k.vertices.push(new THREE.Vertex(O))
            }
        for (I = 0; I < L; I++)
            for (C = 0; C < E; C++) {
                k.faces.push(new THREE.Face4(C + M * I + R, C +
                    M * (I + 1) + R, C + 1 + M * (I + 1) + R, C + 1 + M * I + R, null, null, K));
                k.faceVertexUvs[0].push([new THREE.UV(C / E, I / L), new THREE.UV(C / E, (I + 1) / L), new THREE.UV((C + 1) / E, (I + 1) / L), new THREE.UV((C + 1) / E, I / L)])
            }
    }
    THREE.Geometry.call(this);
    var k = this,
        m = a / 2,
        p = d / 2,
        o = b / 2;
    h = h ? -1 : 1;
    if (g !== undefined)
        if (g instanceof Array) this.materials = g;
        else {
            this.materials = [];
            for (var x = 0; x < 6; x++) this.materials.push([g])
        }
    else this.materials = [];
    this.sides = {
        px: !0,
        nx: !0,
        py: !0,
        ny: !0,
        pz: !0,
        nz: !0
    };
    if (j != undefined)
        for (var w in j) this.sides[w] != undefined && (this.sides[w] = j[w]);
    this.sides.px && l("z", "y", 1 * h, -1, b, d, -m, this.materials[0]);
    this.sides.nx && l("z", "y", -1 * h, -1, b, d, m, this.materials[1]);
    this.sides.py && l("x", "z", 1 * h, 1, a, b, p, this.materials[2]);
    this.sides.ny && l("x", "z", 1 * h, -1, a, b, -p, this.materials[3]);
    this.sides.pz && l("x", "y", 1 * h, -1, a, d, o, this.materials[4]);
    this.sides.nz && l("x", "y", -1 * h, -1, a, d, -o, this.materials[5]);
    (function() {
        for (var u = [], B = [], z = 0, n = k.vertices.length; z < n; z++) {
            for (var y = k.vertices[z], C = !1, G = 0, K = u.length; G < K; G++) {
                var J = u[G];
                if (y.position.x == J.position.x && y.position.y == J.position.y && y.position.z == J.position.z) {
                    B[z] = G;
                    C = !0;
                    break
                }
            }
            if (!C) {
                B[z] = u.length;
                u.push(new THREE.Vertex(y.position.clone()))
            }
        }
        z = 0;
        for (n = k.faces.length; z < n; z++) {
            y = k.faces[z];
            y.a = B[y.a];
            y.b = B[y.b];
            y.c = B[y.c];
            y.d = B[y.d]
        }
        k.vertices = u
    })();
    this.computeCentroids();
    this.computeFaceNormals()
};
THREE.Cube.prototype = new THREE.Geometry;
THREE.Cube.prototype.constructor = THREE.Cube;
THREE.Cylinder = function(a, d, b, e, c, f) {
    function g(p, o, x) {
        h.vertices.push(new THREE.Vertex(new THREE.Vector3(p, o, x)))
    }
    THREE.Geometry.call(this);
    var h = this,
        j, l = Math.PI * 2,
        k = e / 2;
    for (j = 0; j < a; j++) g(Math.sin(l * j / a) * d, Math.cos(l * j / a) * d, -k);
    for (j = 0; j < a; j++) g(Math.sin(l * j / a) * b, Math.cos(l * j / a) * b, k);
    for (j = 0; j < a; j++) h.faces.push(new THREE.Face4(j, j + a, a + (j + 1) % a, (j + 1) % a));
    if (b > 0) {
        g(0, 0, -k - (f || 0));
        for (j = a; j < a + a / 2; j++) h.faces.push(new THREE.Face4(2 * a, (2 * j - 2 * a) % a, (2 * j - 2 * a + 1) % a, (2 * j - 2 * a + 2) % a))
    }
    if (d > 0) {
        g(0, 0, k + (c || 0));
        for (j = a + a / 2; j < 2 * a; j++) h.faces.push(new THREE.Face4(2 * a + 1, (2 * j - 2 * a + 2) % a + a, (2 * j - 2 * a + 1) % a + a, (2 * j - 2 * a) % a + a))
    }
    j = 0;
    for (a = this.faces.length; j < a; j++) {
        d = [];
        b = this.faces[j];
        c = this.vertices[b.a];
        f = this.vertices[b.b];
        k = this.vertices[b.c];
        var m = this.vertices[b.d];
        d.push(new THREE.UV(0.5 + Math.atan2(c.position.x, c.position.y) / l, 0.5 + c.position.z / e));
        d.push(new THREE.UV(0.5 + Math.atan2(f.position.x, f.position.y) / l, 0.5 + f.position.z / e));
        d.push(new THREE.UV(0.5 + Math.atan2(k.position.x, k.position.y) / l, 0.5 + k.position.z / e));
        b instanceof THREE.Face4 && d.push(new THREE.UV(0.5 + Math.atan2(m.position.x, m.position.y) / l, 0.5 + m.position.z / e));
        this.faceVertexUvs[0].push(d)
    }
    this.computeCentroids();
    this.computeFaceNormals()
};
THREE.Cylinder.prototype = new THREE.Geometry;
THREE.Cylinder.prototype.constructor = THREE.Cylinder;
THREE.Icosahedron = function(a) {
    function d(m, p, o) {
        var x = Math.sqrt(m * m + p * p + o * o);
        return c.vertices.push(new THREE.Vertex(new THREE.Vector3(m / x, p / x, o / x))) - 1
    }

    function b(m, p, o, x) {
        x.faces.push(new THREE.Face3(m, p, o))
    }

    function e(m, p) {
        var o = c.vertices[m].position,
            x = c.vertices[p].position;
        return d((o.x + x.x) / 2, (o.y + x.y) / 2, (o.z + x.z) / 2)
    }
    var c = this,
        f = new THREE.Geometry,
        g;
    this.subdivisions = a || 0;
    THREE.Geometry.call(this);
    a = (1 + Math.sqrt(5)) / 2;
    d(-1, a, 0);
    d(1, a, 0);
    d(-1, -a, 0);
    d(1, -a, 0);
    d(0, -1, a);
    d(0, 1, a);
    d(0, -1, -a);
    d(0, 1, -a);
    d(a, 0, -1);
    d(a, 0, 1);
    d(-a, 0, -1);
    d(-a, 0, 1);
    b(0, 11, 5, f);
    b(0, 5, 1, f);
    b(0, 1, 7, f);
    b(0, 7, 10, f);
    b(0, 10, 11, f);
    b(1, 5, 9, f);
    b(5, 11, 4, f);
    b(11, 10, 2, f);
    b(10, 7, 6, f);
    b(7, 1, 8, f);
    b(3, 9, 4, f);
    b(3, 4, 2, f);
    b(3, 2, 6, f);
    b(3, 6, 8, f);
    b(3, 8, 9, f);
    b(4, 9, 5, f);
    b(2, 4, 11, f);
    b(6, 2, 10, f);
    b(8, 6, 7, f);
    b(9, 8, 1, f);
    for (a = 0; a < this.subdivisions; a++) {
        g = new THREE.Geometry;
        for (var h in f.faces) {
            var j = e(f.faces[h].a, f.faces[h].b),
                l = e(f.faces[h].b, f.faces[h].c),
                k = e(f.faces[h].c, f.faces[h].a);
            b(f.faces[h].a, j, k, g);
            b(f.faces[h].b, l, j, g);
            b(f.faces[h].c, k, l, g);
            b(j, l, k, g)
        }
        f.faces = g.faces
    }
    c.faces = f.faces;
    delete f;
    delete g;
    this.computeCentroids();
    this.computeFaceNormals();
    this.computeVertexNormals()
};
THREE.Icosahedron.prototype = new THREE.Geometry;
THREE.Icosahedron.prototype.constructor = THREE.Icosahedron;
THREE.Lathe = function(a, d, b) {
    THREE.Geometry.call(this);
    this.steps = d || 12;
    this.angle = b || 2 * Math.PI;
    d = this.angle / this.steps;
    b = [];
    for (var e = [], c = [], f = [], g = (new THREE.Matrix4).setRotationZ(d), h = 0; h < a.length; h++) {
        this.vertices.push(new THREE.Vertex(a[h]));
        b[h] = a[h].clone();
        e[h] = this.vertices.length - 1
    }
    for (var j = 0; j <= this.angle + 0.0010; j += d) {
        for (h = 0; h < b.length; h++)
            if (j < this.angle) {
                b[h] = g.multiplyVector3(b[h].clone());
                this.vertices.push(new THREE.Vertex(b[h]));
                c[h] = this.vertices.length - 1
            } else c = f;
        j == 0 && (f = e);
        for (h = 0; h < e.length - 1; h++) {
            this.faces.push(new THREE.Face4(c[h], c[h + 1], e[h + 1], e[h]));
            this.faceVertexUvs[0].push([new THREE.UV(1 - j / this.angle, h / a.length), new THREE.UV(1 - j / this.angle, (h + 1) / a.length), new THREE.UV(1 - (j - d) / this.angle, (h + 1) / a.length), new THREE.UV(1 - (j - d) / this.angle, h / a.length)])
        }
        e = c;
        c = []
    }
    this.computeCentroids();
    this.computeFaceNormals();
    this.computeVertexNormals()
};
THREE.Lathe.prototype = new THREE.Geometry;
THREE.Lathe.prototype.constructor = THREE.Lathe;
THREE.Plane = function(a, d, b, e) {
    THREE.Geometry.call(this);
    var c, f = a / 2,
        g = d / 2;
    b = b || 1;
    e = e || 1;
    var h = b + 1,
        j = e + 1;
    a /= b;
    var l = d / e;
    for (c = 0; c < j; c++)
        for (d = 0; d < h; d++) this.vertices.push(new THREE.Vertex(new THREE.Vector3(d * a - f, -(c * l - g), 0)));
    for (c = 0; c < e; c++)
        for (d = 0; d < b; d++) {
            this.faces.push(new THREE.Face4(d + h * c, d + h * (c + 1), d + 1 + h * (c + 1), d + 1 + h * c));
            this.faceVertexUvs[0].push([new THREE.UV(d / b, c / e), new THREE.UV(d / b, (c + 1) / e), new THREE.UV((d + 1) / b, (c + 1) / e), new THREE.UV((d + 1) / b, c / e)])
        }
    this.computeCentroids();
    this.computeFaceNormals()
};
THREE.Plane.prototype = new THREE.Geometry;
THREE.Plane.prototype.constructor = THREE.Plane;
THREE.Sphere = function(a, d, b) {
    THREE.Geometry.call(this);
    var e, c = Math.PI,
        f = Math.max(3, d || 8),
        g = Math.max(2, b || 6);
    d = [];
    for (b = 0; b < g + 1; b++) {
        e = b / g;
        var h = a * Math.cos(e * c),
            j = a * Math.sin(e * c),
            l = [],
            k = 0;
        for (e = 0; e < f; e++) {
            var m = 2 * e / f,
                p = j * Math.sin(m * c);
            m = j * Math.cos(m * c);
            (b == 0 || b == g) && e > 0 || (k = this.vertices.push(new THREE.Vertex(new THREE.Vector3(m, h, p))) - 1);
            l.push(k)
        }
        d.push(l)
    }
    var o, x, w;
    c = d.length;
    for (b = 0; b < c; b++) {
        f = d[b].length;
        if (b > 0)
            for (e = 0; e < f; e++) {
                l = e == f - 1;
                g = d[b][l ? 0 : e + 1];
                h = d[b][l ? f - 1 : e];
                j = d[b - 1][l ? f - 1 : e];
                l = d[b -
                    1][l ? 0 : e + 1];
                p = b / (c - 1);
                o = (b - 1) / (c - 1);
                x = (e + 1) / f;
                m = e / f;
                k = new THREE.UV(1 - x, p);
                p = new THREE.UV(1 - m, p);
                m = new THREE.UV(1 - m, o);
                var u = new THREE.UV(1 - x, o);
                if (b < d.length - 1) {
                    o = this.vertices[g].position.clone();
                    x = this.vertices[h].position.clone();
                    w = this.vertices[j].position.clone();
                    o.normalize();
                    x.normalize();
                    w.normalize();
                    this.faces.push(new THREE.Face3(g, h, j, [new THREE.Vector3(o.x, o.y, o.z), new THREE.Vector3(x.x, x.y, x.z), new THREE.Vector3(w.x, w.y, w.z)]));
                    this.faceVertexUvs[0].push([k, p, m])
                }
                if (b > 1) {
                    o = this.vertices[g].position.clone();
                    x = this.vertices[j].position.clone();
                    w = this.vertices[l].position.clone();
                    o.normalize();
                    x.normalize();
                    w.normalize();
                    this.faces.push(new THREE.Face3(g, j, l, [new THREE.Vector3(o.x, o.y, o.z), new THREE.Vector3(x.x, x.y, x.z), new THREE.Vector3(w.x, w.y, w.z)]));
                    this.faceVertexUvs[0].push([k, m, u])
                }
            }
    }
    this.computeCentroids();
    this.computeFaceNormals();
    this.computeVertexNormals();
    this.boundingSphere = {
        radius: a
    }
};
THREE.Sphere.prototype = new THREE.Geometry;
THREE.Sphere.prototype.constructor = THREE.Sphere;
THREE.Torus = function(a, d, b, e) {
    THREE.Geometry.call(this);
    this.radius = a || 100;
    this.tube = d || 40;
    this.segmentsR = b || 8;
    this.segmentsT = e || 6;
    a = [];
    for (d = 0; d <= this.segmentsR; ++d)
        for (b = 0; b <= this.segmentsT; ++b) {
            e = b / this.segmentsT * 2 * Math.PI;
            var c = d / this.segmentsR * 2 * Math.PI;
            this.vertices.push(new THREE.Vertex(new THREE.Vector3((this.radius + this.tube * Math.cos(c)) * Math.cos(e), (this.radius + this.tube * Math.cos(c)) * Math.sin(e), this.tube * Math.sin(c))));
            a.push([b / this.segmentsT, 1 - d / this.segmentsR])
        }
    for (d = 1; d <= this.segmentsR; ++d)
        for (b = 1; b <= this.segmentsT; ++b) {
            e = (this.segmentsT + 1) * d + b;
            c = (this.segmentsT + 1) * d + b - 1;
            var f = (this.segmentsT + 1) * (d - 1) + b - 1,
                g = (this.segmentsT + 1) * (d - 1) + b;
            this.faces.push(new THREE.Face4(e, c, f, g));
            this.faceVertexUvs[0].push([new THREE.UV(a[e][0], a[e][1]), new THREE.UV(a[c][0], a[c][1]), new THREE.UV(a[f][0], a[f][1]), new THREE.UV(a[g][0], a[g][1])])
        }
    delete a;
    this.computeCentroids();
    this.computeFaceNormals();
    this.computeVertexNormals()
};
THREE.Torus.prototype = new THREE.Geometry;
THREE.Torus.prototype.constructor = THREE.Torus;
THREE.TorusKnot = function(a, d, b, e, c, f, g) {
    function h(m, p, o, x, w, u) {
        p = o / x * m;
        o = Math.cos(p);
        return new THREE.Vector3(w * (2 + o) * 0.5 * Math.cos(m), w * (2 + o) * Math.sin(m) * 0.5, u * w * Math.sin(p) * 0.5)
    }
    THREE.Geometry.call(this);
    this.radius = a || 200;
    this.tube = d || 40;
    this.segmentsR = b || 64;
    this.segmentsT = e || 8;
    this.p = c || 2;
    this.q = f || 3;
    this.heightScale = g || 1;
    this.grid = Array(this.segmentsR);
    b = new THREE.Vector3;
    e = new THREE.Vector3;
    f = new THREE.Vector3;
    for (a = 0; a < this.segmentsR; ++a) {
        this.grid[a] = Array(this.segmentsT);
        for (d = 0; d < this.segmentsT; ++d) {
            var j = a / this.segmentsR * 2 * this.p * Math.PI;
            g = d / this.segmentsT * 2 * Math.PI;
            c = h(j, g, this.q, this.p, this.radius, this.heightScale);
            j = h(j + 0.01, g, this.q, this.p, this.radius, this.heightScale);
            b.x = j.x - c.x;
            b.y = j.y - c.y;
            b.z = j.z - c.z;
            e.x = j.x + c.x;
            e.y = j.y + c.y;
            e.z = j.z + c.z;
            f.cross(b, e);
            e.cross(f, b);
            f.normalize();
            e.normalize();
            j = -this.tube * Math.cos(g);
            g = this.tube * Math.sin(g);
            c.x += j * e.x + g * f.x;
            c.y += j * e.y + g * f.y;
            c.z += j * e.z + g * f.z;
            this.grid[a][d] = this.vertices.push(new THREE.Vertex(new THREE.Vector3(c.x, c.y, c.z))) - 1
        }
    }
    for (a = 0; a < this.segmentsR; ++a)
        for (d = 0; d < this.segmentsT; ++d) {
            e = (a + 1) % this.segmentsR;
            f = (d + 1) % this.segmentsT;
            c = this.grid[a][d];
            b = this.grid[e][d];
            e = this.grid[e][f];
            f = this.grid[a][f];
            g = new THREE.UV(a / this.segmentsR, d / this.segmentsT);
            j = new THREE.UV((a + 1) / this.segmentsR, d / this.segmentsT);
            var l = new THREE.UV((a + 1) / this.segmentsR, (d + 1) / this.segmentsT),
                k = new THREE.UV(a / this.segmentsR, (d + 1) / this.segmentsT);
            this.faces.push(new THREE.Face4(c, b, e, f));
            this.faceVertexUvs[0].push([g, j, l, k])
        }
    this.computeCentroids();
    this.computeFaceNormals();
    this.computeVertexNormals()
};
THREE.TorusKnot.prototype = new THREE.Geometry;
THREE.TorusKnot.prototype.constructor = THREE.TorusKnot;
THREE.Loader = function(a) {
    this.statusDomElement = (this.showStatus = a) ? THREE.Loader.prototype.addStatusElement() : null;
    this.onLoadStart = function() {};
    this.onLoadProgress = function() {};
    this.onLoadComplete = function() {}
};
THREE.Loader.prototype = {
    addStatusElement: function() {
        var a = document.createElement("div");
        a.style.position = "absolute";
        a.style.right = "0px";
        a.style.top = "0px";
        a.style.fontSize = "0.8em";
        a.style.textAlign = "left";
        a.style.background = "rgba(0,0,0,0.25)";
        a.style.color = "#fff";
        a.style.width = "120px";
        a.style.padding = "0.5em 0.5em 0.5em 0.5em";
        a.style.zIndex = 1E3;
        a.innerHTML = "Loading ...";
        return a
    },
    updateProgress: function(a) {
        var d = "Loaded ";
        d += a.total ? (100 * a.loaded / a.total).toFixed(0) + "%" : (a.loaded / 1E3).toFixed(2) + " KB";
        this.statusDomElement.innerHTML = d
    },
    extractUrlbase: function(a) {
        a = a.split("/");
        a.pop();
        return a.join("/")
    },
    init_materials: function(a, d, b) {
        a.materials = [];
        for (var e = 0; e < d.length; ++e) a.materials[e] = [THREE.Loader.prototype.createMaterial(d[e], b)]
    },
    createMaterial: function(a, d) {
        function b(h) {
            h = Math.log(h) / Math.LN2;
            return Math.floor(h) == h
        }

        function e(h, j) {
            var l = new Image;
            l.onload = function() {
                if (!b(this.width) || !b(this.height)) {
                    var k = Math.pow(2, Math.round(Math.log(this.width) / Math.LN2)),
                        m = Math.pow(2, Math.round(Math.log(this.height) / Math.LN2));
                    h.image.width = k;
                    h.image.height = m;
                    h.image.getContext("2d").drawImage(this, 0, 0, k, m)
                } else h.image = this;
                h.needsUpdate = !0
            };
            l.src = j
        }
        var c, f, g;
        c = "MeshLambertMaterial";
        f = {
            color: 15658734,
            opacity: 1,
            map: null,
            lightMap: null,
            wireframe: a.wireframe
        };
        if (a.shading)
            if (a.shading == "Phong") c = "MeshPhongMaterial";
            else a.shading == "Basic" && (c = "MeshBasicMaterial");
        if (a.blending)
            if (a.blending == "Additive") f.blending = THREE.AdditiveBlending;
            else if (a.blending == "Subtractive") f.blending = THREE.SubtractiveBlending;
        else if (a.blending == "Multiply") f.blending = THREE.MultiplyBlending;
        if (a.transparent !== undefined) f.transparent = a.transparent;
        if (a.depthTest !== undefined) f.depthTest = a.depthTest;
        if (a.vertexColors !== undefined)
            if (a.vertexColors == "face") f.vertexColors = THREE.FaceColors;
            else if (a.vertexColors) f.vertexColors = THREE.VertexColors;
        if (a.mapDiffuse && d) {
            g = document.createElement("canvas");
            f.map = new THREE.Texture(g);
            f.map.sourceFile = a.mapDiffuse;
            e(f.map, d + "/" + a.mapDiffuse)
        } else if (a.colorDiffuse) {
            g = (a.colorDiffuse[0] * 255 << 16) + (a.colorDiffuse[1] * 255 << 8) + a.colorDiffuse[2] * 255;
            f.color = g;
            f.opacity = a.transparency
        } else if (a.DbgColor) f.color = a.DbgColor;
        if (a.mapLightmap && d) {
            g = document.createElement("canvas");
            f.lightMap = new THREE.Texture(g);
            f.lightMap.sourceFile = a.mapLightmap;
            e(f.lightMap, d + "/" + a.mapLightmap)
        }
        return new THREE[c](f)
    }
};
THREE.JSONLoader = function(a) {
    THREE.Loader.call(this, a)
};
THREE.JSONLoader.prototype = new THREE.Loader;
THREE.JSONLoader.prototype.constructor = THREE.JSONLoader;
THREE.JSONLoader.prototype.supr = THREE.Loader.prototype;
THREE.JSONLoader.prototype.load = function(a) {
    var d = this,
        b = a.model,
        e = a.callback,
        c = a.texture_path ? a.texture_path : this.extractUrlbase(b);
    a = new Worker(b);
    a.onmessage = function(f) {
        d.createModel(f.data, e, c);
        d.onLoadComplete()
    };
    this.onLoadStart();
    a.postMessage((new Date).getTime())
};
THREE.JSONLoader.prototype.createModel = function(a, d, b) {
    var e = new THREE.Geometry;
    this.init_materials(e, a.materials, b);
    (function() {
        if (a.version === undefined || a.version != 2) console.error("Deprecated file format.");
        else {
            var c, f, g, h, j, l, k, m, p, o, x, w, u, B, z, n = a.faces;
            o = a.vertices;
            var y = a.normals,
                C = a.colors;
            l = a.scale !== undefined ? a.scale : 1;
            var G = 0;
            for (c = 0; c < a.uvs.length; c++) a.uvs[c].length && G++;
            for (c = 0; c < G; c++) {
                e.faceUvs[c] = [];
                e.faceVertexUvs[c] = []
            }
            h = 0;
            for (j = o.length; h < j;) {
                k = new THREE.Vertex;
                k.position.x = o[h++] / l;
                k.position.y = o[h++] / l;
                k.position.z = o[h++] / l;
                e.vertices.push(k)
            }
            h = 0;
            for (j = n.length; h < j;) {
                o = n[h++];
                l = o & 1;
                g = o & 2;
                c = o & 4;
                f = o & 8;
                m = o & 16;
                k = o & 32;
                x = o & 64;
                o &= 128;
                if (l) {
                    w = new THREE.Face4;
                    w.a = n[h++];
                    w.b = n[h++];
                    w.c = n[h++];
                    w.d = n[h++];
                    l = 4
                } else {
                    w = new THREE.Face3;
                    w.a = n[h++];
                    w.b = n[h++];
                    w.c = n[h++];
                    l = 3
                }
                if (g) {
                    g = n[h++];
                    w.materials = e.materials[g]
                }
                g = e.faces.length;
                if (c)
                    for (c = 0; c < G; c++) {
                        u = a.uvs[c];
                        p = n[h++];
                        z = u[p * 2];
                        p = u[p * 2 + 1];
                        e.faceUvs[c][g] = new THREE.UV(z, p)
                    }
                if (f)
                    for (c = 0; c < G; c++) {
                        u = a.uvs[c];
                        B = [];
                        for (f = 0; f < l; f++) {
                            p = n[h++];
                            z = u[p * 2];
                            p = u[p * 2 + 1];
                            B[f] = new THREE.UV(z, p)
                        }
                        e.faceVertexUvs[c][g] = B
                    }
                if (m) {
                    m = n[h++] * 3;
                    f = new THREE.Vector3;
                    f.x = y[m++];
                    f.y = y[m++];
                    f.z = y[m];
                    w.normal = f
                }
                if (k)
                    for (c = 0; c < l; c++) {
                        m = n[h++] * 3;
                        f = new THREE.Vector3;
                        f.x = y[m++];
                        f.y = y[m++];
                        f.z = y[m];
                        w.vertexNormals.push(f)
                    }
                if (x) {
                    k = n[h++];
                    k = new THREE.Color(C[k]);
                    w.color = k
                }
                if (o)
                    for (c = 0; c < l; c++) {
                        k = n[h++];
                        k = new THREE.Color(C[k]);
                        w.vertexColors.push(k)
                    }
                e.faces.push(w)
            }
        }
    })();
    (function() {
        var c, f, g, h;
        if (a.skinWeights) {
            c = 0;
            for (f = a.skinWeights.length; c < f; c += 2) {
                g = a.skinWeights[c];
                h = a.skinWeights[c + 1];
                e.skinWeights.push(new THREE.Vector4(g, h, 0, 0))
            }
        }
        if (a.skinIndices) {
            c = 0;
            for (f = a.skinIndices.length; c < f; c += 2) {
                g = a.skinIndices[c];
                h = a.skinIndices[c + 1];
                e.skinIndices.push(new THREE.Vector4(g, h, 0, 0))
            }
        }
        e.bones = a.bones;
        e.animation = a.animation
    })();
    (function() {
        if (a.morphTargets !== undefined) {
            var c, f, g, h, j, l;
            c = 0;
            for (f = a.morphTargets.length; c < f; c++) {
                e.morphTargets[c] = {};
                e.morphTargets[c].name = a.morphTargets[c].name;
                e.morphTargets[c].vertices = [];
                j = e.morphTargets[c].vertices;
                l = a.morphTargets[c].vertices;
                g = 0;
                for (h = l.length; g < h; g += 3) j.push(new THREE.Vertex(new THREE.Vector3(l[g], l[g + 1], l[g + 2])))
            }
        }
        if (a.morphColors !== undefined) {
            var k, m;
            c = 0;
            for (f = a.morphColors.length; c < f; c++) {
                e.morphColors[c] = {};
                e.morphColors[c].name = a.morphColors[c].name;
                e.morphColors[c].colors = [];
                l = e.morphColors[c].colors;
                k = a.morphColors[c].colors;
                h = 0;
                for (j = k.length; h < j; h += 3) {
                    m = new THREE.Color(16755200);
                    m.setRGB(k[g], k[g + 1], k[g + 2]);
                    l.push(m)
                }
            }
        }
    })();
    (function() {
        if (a.edges !== undefined) {
            var c, f, g;
            for (c = 0; c < a.edges.length; c += 2) {
                f = a.edges[c];
                g = a.edges[c + 1];
                e.edges.push(new THREE.Edge(e.vertices[f], e.vertices[g], f, g))
            }
        }
    })();
    e.computeCentroids();
    e.computeFaceNormals();
    e.computeEdgeFaces();
    d(e)
};
THREE.BinaryLoader = function(a) {
    THREE.Loader.call(this, a)
};
THREE.BinaryLoader.prototype = new THREE.Loader;
THREE.BinaryLoader.prototype.constructor = THREE.BinaryLoader;
THREE.BinaryLoader.prototype.supr = THREE.Loader.prototype;
THREE.BinaryLoader.prototype = {
    load: function(a) {
        var d = a.model,
            b = a.callback,
            e = a.texture_path ? a.texture_path : THREE.Loader.prototype.extractUrlbase(d),
            c = a.bin_path ? a.bin_path : THREE.Loader.prototype.extractUrlbase(d);
        a = (new Date).getTime();
        d = new Worker(d);
        var f = this.showProgress ? THREE.Loader.prototype.updateProgress : null;
        d.onmessage = function(g) {
            THREE.BinaryLoader.prototype.loadAjaxBuffers(g.data.buffers, g.data.materials, b, c, e, f)
        };
        d.onerror = function(g) {
            alert("worker.onerror: " + g.message + "\n" + g.data);
            g.preventDefault()
        };
        d.postMessage(a)
    },
    loadAjaxBuffers: function(a, d, b, e, c, f) {
        var g = new XMLHttpRequest,
            h = e + "/" + a,
            j = 0;
        g.onreadystatechange = function() {
            if (g.readyState == 4) g.status == 200 || g.status == 0 ? THREE.BinaryLoader.prototype.createBinModel(g.responseText, b, c, d) : alert("Couldn't load [" + h + "] [" + g.status + "]");
            else if (g.readyState == 3) {
                if (f) {
                    j == 0 && (j = g.getResponseHeader("Content-Length"));
                    f({
                        total: j,
                        loaded: g.responseText.length
                    })
                }
            } else g.readyState == 2 && (j = g.getResponseHeader("Content-Length"))
        };
        g.open("GET", h, !0);
        g.overrideMimeType("text/plain; charset=x-user-defined");
        g.setRequestHeader("Content-Type", "text/plain");
        g.send(null)
    },
    createBinModel: function(a, d, b, e) {
        var c = function(f) {
            function g(t, v) {
                var A = k(t, v),
                    D = k(t, v + 1),
                    H = k(t, v + 2),
                    S = k(t, v + 3),
                    V = (S << 1 & 255 | H >> 7) - 127;
                A |= (H & 127) << 16 | D << 8;
                if (A == 0 && V == -127) return 0;
                return (1 - 2 * (S >> 7)) * (1 + A * Math.pow(2, -23)) * Math.pow(2, V)
            }

            function h(t, v) {
                var A = k(t, v),
                    D = k(t, v + 1),
                    H = k(t, v + 2);
                return (k(t, v + 3) << 24) + (H << 16) + (D << 8) + A
            }

            function j(t, v) {
                var A = k(t, v);
                return (k(t, v + 1) << 8) + A
            }

            function l(t, v) {
                var A = k(t, v);
                return A > 127 ? A - 256 : A
            }

            function k(t, v) {
                return t.charCodeAt(v) & 255
            }

            function m(t) {
                var v, A, D;
                v = h(a, t);
                A = h(a, t + G);
                D = h(a, t + K);
                t = j(a, t + J);
                THREE.BinaryLoader.prototype.f3(B, v, A, D, t)
            }

            function p(t) {
                var v, A, D, H, S, V;
                v = h(a, t);
                A = h(a, t + G);
                D = h(a, t + K);
                H = j(a, t + J);
                S = h(a, t + I);
                V = h(a, t + E);
                t = h(a, t + L);
                THREE.BinaryLoader.prototype.f3n(B, y, v, A, D, H, S, V, t)
            }

            function o(t) {
                var v, A, D, H;
                v = h(a, t);
                A = h(a, t + P);
                D = h(a, t + Q);
                H = h(a, t + R);
                t = j(a, t + M);
                THREE.BinaryLoader.prototype.f4(B, v, A, D, H, t)
            }

            function x(t) {
                var v, A, D, H, S, V, ca, da;
                v = h(a, t);
                A = h(a, t + P);
                D = h(a, t + Q);
                H = h(a, t + R);
                S = j(a, t + M);
                V = h(a, t + F);
                ca = h(a, t + N);
                da = h(a, t + O);
                t = h(a, t + T);
                THREE.BinaryLoader.prototype.f4n(B, y, v, A, D, H, S, V, ca, da, t)
            }

            function w(t) {
                var v, A;
                v = h(a, t);
                A = h(a, t + U);
                t = h(a, t + X);
                THREE.BinaryLoader.prototype.uv3(B.faceVertexUvs[0], C[v * 2], C[v * 2 + 1], C[A * 2], C[A * 2 + 1], C[t * 2], C[t * 2 + 1])
            }

            function u(t) {
                var v, A, D;
                v = h(a, t);
                A = h(a, t + ea);
                D = h(a, t + fa);
                t = h(a, t + ga);
                THREE.BinaryLoader.prototype.uv4(B.faceVertexUvs[0], C[v * 2], C[v * 2 + 1], C[A * 2], C[A * 2 + 1], C[D * 2], C[D * 2 + 1], C[t * 2], C[t * 2 + 1])
            }
            var B = this,
                z = 0,
                n, y = [],
                C = [],
                G, K, J, I, E, L, P, Q, R, M, F, N, O, T, U, X, ea, fa, ga, Y, Z, $, aa, ba, W;
            THREE.Geometry.call(this);
            THREE.Loader.prototype.init_materials(B, e, f);
            n = {
                signature: a.substr(z, 8),
                header_bytes: k(a, z + 8),
                vertex_coordinate_bytes: k(a, z + 9),
                normal_coordinate_bytes: k(a, z + 10),
                uv_coordinate_bytes: k(a, z + 11),
                vertex_index_bytes: k(a, z + 12),
                normal_index_bytes: k(a, z + 13),
                uv_index_bytes: k(a, z + 14),
                material_index_bytes: k(a, z + 15),
                nvertices: h(a, z + 16),
                nnormals: h(a, z + 16 + 4),
                nuvs: h(a, z + 16 + 8),
                ntri_flat: h(a, z + 16 + 12),
                ntri_smooth: h(a, z + 16 + 16),
                ntri_flat_uv: h(a, z + 16 + 20),
                ntri_smooth_uv: h(a, z + 16 + 24),
                nquad_flat: h(a, z + 16 + 28),
                nquad_smooth: h(a, z + 16 + 32),
                nquad_flat_uv: h(a, z + 16 + 36),
                nquad_smooth_uv: h(a, z + 16 + 40)
            };
            z += n.header_bytes;
            G = n.vertex_index_bytes;
            K = n.vertex_index_bytes * 2;
            J = n.vertex_index_bytes * 3;
            I = n.vertex_index_bytes * 3 + n.material_index_bytes;
            E = n.vertex_index_bytes * 3 + n.material_index_bytes + n.normal_index_bytes;
            L = n.vertex_index_bytes * 3 + n.material_index_bytes + n.normal_index_bytes * 2;
            P = n.vertex_index_bytes;
            Q = n.vertex_index_bytes * 2;
            R = n.vertex_index_bytes * 3;
            M = n.vertex_index_bytes * 4;
            F = n.vertex_index_bytes * 4 + n.material_index_bytes;
            N = n.vertex_index_bytes * 4 + n.material_index_bytes + n.normal_index_bytes;
            O = n.vertex_index_bytes * 4 + n.material_index_bytes + n.normal_index_bytes * 2;
            T = n.vertex_index_bytes * 4 + n.material_index_bytes + n.normal_index_bytes * 3;
            U = n.uv_index_bytes;
            X = n.uv_index_bytes * 2;
            ea = n.uv_index_bytes;
            fa = n.uv_index_bytes * 2;
            ga = n.uv_index_bytes * 3;
            f = n.vertex_index_bytes * 3 + n.material_index_bytes;
            W = n.vertex_index_bytes * 4 + n.material_index_bytes;
            Y = n.ntri_flat * f;
            Z = n.ntri_smooth * (f + n.normal_index_bytes * 3);
            $ = n.ntri_flat_uv * (f + n.uv_index_bytes * 3);
            aa = n.ntri_smooth_uv * (f + n.normal_index_bytes * 3 + n.uv_index_bytes * 3);
            ba = n.nquad_flat * W;
            f = n.nquad_smooth * (W + n.normal_index_bytes * 4);
            W = n.nquad_flat_uv * (W + n.uv_index_bytes * 4);
            z += function(t) {
                for (var v, A, D, H = n.vertex_coordinate_bytes * 3, S = t + n.nvertices * H; t < S; t += H) {
                    v = g(a, t);
                    A = g(a, t + n.vertex_coordinate_bytes);
                    D = g(a, t + n.vertex_coordinate_bytes * 2);
                    THREE.BinaryLoader.prototype.v(B, v, A, D)
                }
                return n.nvertices * H
            }(z);
            z += function(t) {
                for (var v, A, D, H = n.normal_coordinate_bytes * 3, S = t + n.nnormals * H; t < S; t += H) {
                    v = l(a, t);
                    A = l(a, t + n.normal_coordinate_bytes);
                    D = l(a, t + n.normal_coordinate_bytes * 2);
                    y.push(v / 127, A / 127, D / 127)
                }
                return n.nnormals * H
            }(z);
            z += function(t) {
                for (var v, A, D = n.uv_coordinate_bytes * 2, H = t + n.nuvs * D; t < H; t += D) {
                    v = g(a, t);
                    A = g(a, t + n.uv_coordinate_bytes);
                    C.push(v, A)
                }
                return n.nuvs * D
            }(z);
            Y = z + Y;
            Z = Y + Z;
            $ = Z + $;
            aa = $ + aa;
            ba = aa + ba;
            f = ba + f;
            W = f + W;
            (function(t) {
                var v, A = n.vertex_index_bytes * 3 + n.material_index_bytes,
                    D = A + n.uv_index_bytes * 3,
                    H = t + n.ntri_flat_uv * D;
                for (v = t; v < H; v += D) {
                    m(v);
                    w(v + A)
                }
                return H - t
            })(Z);
            (function(t) {
                var v, A = n.vertex_index_bytes * 3 + n.material_index_bytes + n.normal_index_bytes * 3,
                    D = A + n.uv_index_bytes * 3,
                    H = t + n.ntri_smooth_uv * D;
                for (v = t; v < H; v += D) {
                    p(v);
                    w(v + A)
                }
                return H - t
            })($);
            (function(t) {
                var v, A = n.vertex_index_bytes * 4 + n.material_index_bytes,
                    D = A + n.uv_index_bytes * 4,
                    H = t + n.nquad_flat_uv * D;
                for (v = t; v < H; v += D) {
                    o(v);
                    u(v + A)
                }
                return H - t
            })(f);
            (function(t) {
                var v, A = n.vertex_index_bytes * 4 + n.material_index_bytes + n.normal_index_bytes * 4,
                    D = A + n.uv_index_bytes * 4,
                    H = t + n.nquad_smooth_uv * D;
                for (v = t; v < H; v += D) {
                    x(v);
                    u(v + A)
                }
                return H - t
            })(W);
            (function(t) {
                var v, A = n.vertex_index_bytes * 3 + n.material_index_bytes,
                    D = t + n.ntri_flat * A;
                for (v = t; v < D; v += A) m(v);
                return D - t
            })(z);
            (function(t) {
                var v, A = n.vertex_index_bytes * 3 + n.material_index_bytes + n.normal_index_bytes * 3,
                    D = t + n.ntri_smooth * A;
                for (v = t; v < D; v += A) p(v);
                return D - t
            })(Y);
            (function(t) {
                var v, A = n.vertex_index_bytes * 4 + n.material_index_bytes,
                    D = t + n.nquad_flat * A;
                for (v = t; v < D; v += A) o(v);
                return D - t
            })(aa);
            (function(t) {
                var v, A = n.vertex_index_bytes * 4 + n.material_index_bytes + n.normal_index_bytes * 4,
                    D = t + n.nquad_smooth * A;
                for (v = t; v < D; v += A) x(v);
                return D - t
            })(ba);
            this.computeCentroids();
            this.computeFaceNormals()
        };
        c.prototype = new THREE.Geometry;
        c.prototype.constructor = c;
        d(new c(b))
    },
    v: function(a, d, b, e) {
        a.vertices.push(new THREE.Vertex(new THREE.Vector3(d, b, e)))
    },
    f3: function(a, d, b, e, c) {
        a.faces.push(new THREE.Face3(d, b, e, null, null, a.materials[c]))
    },
    f4: function(a, d, b, e, c, f) {
        a.faces.push(new THREE.Face4(d, b, e, c, null, null, a.materials[f]))
    },
    f3n: function(a, d, b, e, c, f, g, h, j) {
        f = a.materials[f];
        var l = d[h * 3],
            k = d[h * 3 + 1];
        h = d[h * 3 + 2];
        var m = d[j * 3],
            p = d[j * 3 + 1];
        j = d[j * 3 + 2];
        a.faces.push(new THREE.Face3(b, e, c, [new THREE.Vector3(d[g * 3], d[g * 3 + 1], d[g * 3 + 2]), new THREE.Vector3(l, k, h), new THREE.Vector3(m, p, j)], null, f))
    },
    f4n: function(a, d, b, e, c, f, g, h, j, l, k) {
        g = a.materials[g];
        var m = d[j * 3],
            p = d[j * 3 + 1];
        j = d[j * 3 + 2];
        var o = d[l * 3],
            x = d[l * 3 + 1];
        l = d[l * 3 + 2];
        var w = d[k * 3],
            u = d[k * 3 + 1];
        k = d[k * 3 + 2];
        a.faces.push(new THREE.Face4(b, e, c, f, [new THREE.Vector3(d[h * 3], d[h * 3 + 1], d[h * 3 + 2]), new THREE.Vector3(m, p, j), new THREE.Vector3(o, x, l), new THREE.Vector3(w, u, k)], null, g))
    },
    uv3: function(a, d, b, e, c, f, g) {
        var h = [];
        h.push(new THREE.UV(d, b));
        h.push(new THREE.UV(e, c));
        h.push(new THREE.UV(f, g));
        a.push(h)
    },
    uv4: function(a, d, b, e, c, f, g, h, j) {
        var l = [];
        l.push(new THREE.UV(d, b));
        l.push(new THREE.UV(e, c));
        l.push(new THREE.UV(f, g));
        l.push(new THREE.UV(h, j));
        a.push(l)
    }
};
THREE.SceneLoader = function() {};
THREE.SceneLoader.prototype = {
    load: function(a, d, b, e) {
        var c = new Worker(a);
        c.postMessage(0);
        var f = THREE.Loader.prototype.extractUrlbase(a);
        c.onmessage = function(g) {
            function h(U, X) {
                return X == "relativeToHTML" ? U : f + "/" + U
            }

            function j() {
                for (o in E.objects)
                    if (!F.objects[o]) {
                        z = E.objects[o];
                        if (G = F.geometries[z.geometry]) {
                            I = [];
                            for (T = 0; T < z.materials.length; T++) I[T] = F.materials[z.materials[T]];
                            n = z.position;
                            r = z.rotation;
                            q = z.quaternion;
                            s = z.scale;
                            q = 0;
                            I.length == 0 && (I[0] = new THREE.MeshFaceMaterial);
                            object = new THREE.Mesh(G, I);
                            object.position.set(n[0], n[1], n[2]);
                            if (q) {
                                object.quaternion.set(q[0], q[1], q[2], q[3]);
                                object.useQuaternion = !0
                            } else object.rotation.set(r[0], r[1], r[2]);
                            object.scale.set(s[0], s[1], s[2]);
                            object.visible = z.visible;
                            F.scene.addObject(object);
                            F.objects[o] = object;
                            if (z.meshCollider) {
                                var U = THREE.CollisionUtils.MeshColliderWBox(object);
                                THREE.Collisions.colliders.push(U)
                            }
                        }
                    }
            }

            function l(U) {
                return function(X) {
                    F.geometries[U] = X;
                    j();
                    P -= 1;
                    k()
                }
            }

            function k() {
                e({
                    total_models: R,
                    total_textures: M,
                    loaded_models: R - P,
                    loaded_textures: M -
                        Q
                }, F);
                P == 0 && Q == 0 && b(F)
            }
            var m, p, o, x, w, u, B, z, n, y, C, G, K, J, I, E, L, P, Q, R, M, F;
            E = g.data;
            g = new THREE.BinaryLoader;
            L = new THREE.JSONLoader;
            Q = P = 0;
            F = {
                scene: new THREE.Scene,
                geometries: {},
                materials: {},
                textures: {},
                objects: {},
                cameras: {},
                lights: {},
                fogs: {}
            };
            if (E.transform) {
                var N = E.transform.position;
                y = E.transform.rotation;
                var O = E.transform.scale;
                N && F.scene.position.set(N[0], N[1], N[2]);
                y && F.scene.rotation.set(y[0], y[1], y[2]);
                O && F.scene.scale.set(O[0], O[1], O[2]);
                (N || y || O) && F.scene.updateMatrix()
            }
            N = function() {
                Q -= 1;
                k()
            };
            for (w in E.cameras) {
                y = E.cameras[w];
                if (y.type == "perspective") K = new THREE.Camera(y.fov, y.aspect, y.near, y.far);
                else if (y.type == "ortho") {
                    K = new THREE.Camera;
                    K.projectionMatrix = THREE.Matrix4.makeOrtho(y.left, y.right, y.top, y.bottom, y.near, y.far)
                }
                n = y.position;
                y = y.target;
                K.position.set(n[0], n[1], n[2]);
                K.target.position.set(y[0], y[1], y[2]);
                F.cameras[w] = K
            }
            for (x in E.lights) {
                w = E.lights[x];
                K = w.color !== undefined ? w.color : 16777215;
                y = w.intensity !== undefined ? w.intensity : 1;
                if (w.type == "directional") {
                    n = w.direction;
                    light = new THREE.DirectionalLight(K, y);
                    light.position.set(n[0], n[1], n[2]);
                    light.position.normalize()
                } else if (w.type == "point") {
                    n = w.position;
                    light = new THREE.PointLight(K, y);
                    light.position.set(n[0], n[1], n[2])
                }
                F.scene.addLight(light);
                F.lights[x] = light
            }
            for (u in E.fogs) {
                x = E.fogs[u];
                if (x.type == "linear") J = new THREE.Fog(0, x.near, x.far);
                else x.type == "exp2" && (J = new THREE.FogExp2(0, x.density));
                y = x.color;
                J.color.setRGB(y[0], y[1], y[2]);
                F.fogs[u] = J
            }
            if (F.cameras && E.defaults.camera) F.currentCamera = F.cameras[E.defaults.camera];
            if (F.fogs && E.defaults.fog) F.scene.fog = F.fogs[E.defaults.fog];
            y = E.defaults.bgcolor;
            F.bgColor = new THREE.Color;
            F.bgColor.setRGB(y[0], y[1], y[2]);
            F.bgColorAlpha = E.defaults.bgalpha;
            for (m in E.geometries) {
                u = E.geometries[m];
                if (u.type == "bin_mesh" || u.type == "ascii_mesh") P += 1
            }
            R = P;
            for (m in E.geometries) {
                u = E.geometries[m];
                if (u.type == "cube") {
                    G = new THREE.Cube(u.width, u.height, u.depth, u.segmentsWidth, u.segmentsHeight, u.segmentsDepth, null, u.flipped, u.sides);
                    F.geometries[m] = G
                } else if (u.type == "plane") {
                    G = new THREE.Plane(u.width, u.height, u.segmentsWidth, u.segmentsHeight);
                    F.geometries[m] = G
                } else if (u.type == "sphere") {
                    G = new THREE.Sphere(u.radius, u.segmentsWidth, u.segmentsHeight);
                    F.geometries[m] = G
                } else if (u.type == "cylinder") {
                    G = new THREE.Cylinder(u.numSegs, u.topRad, u.botRad, u.height, u.topOffset, u.botOffset);
                    F.geometries[m] = G
                } else if (u.type == "torus") {
                    G = new THREE.Torus(u.radius, u.tube, u.segmentsR, u.segmentsT);
                    F.geometries[m] = G
                } else if (u.type == "icosahedron") {
                    G = new THREE.Icosahedron(u.subdivisions);
                    F.geometries[m] = G
                } else if (u.type == "bin_mesh") g.load({
                    model: h(u.url, E.urlBaseType),
                    callback: l(m)
                });
                else u.type == "ascii_mesh" && L.load({
                    model: h(u.url, E.urlBaseType),
                    callback: l(m)
                })
            }
            for (B in E.textures) {
                m = E.textures[B];
                Q += m.url instanceof Array ? m.url.length : 1
            }
            M = Q;
            for (B in E.textures) {
                m = E.textures[B];
                if (m.mapping != undefined && THREE[m.mapping] != undefined) m.mapping = new THREE[m.mapping];
                if (m.url instanceof Array) {
                    u = [];
                    for (var T = 0; T < m.url.length; T++) u[T] = h(m.url[T], E.urlBaseType);
                    u = THREE.ImageUtils.loadTextureCube(u, m.mapping, N)
                } else {
                    u = THREE.ImageUtils.loadTexture(h(m.url, E.urlBaseType), m.mapping, N);
                    if (THREE[m.minFilter] != undefined) u.minFilter = THREE[m.minFilter];
                    if (THREE[m.magFilter] != undefined) u.magFilter = THREE[m.magFilter]
                }
                F.textures[B] = u
            }
            for (p in E.materials) {
                B = E.materials[p];
                for (C in B.parameters)
                    if (C == "envMap" || C == "map" || C == "lightMap") B.parameters[C] = F.textures[B.parameters[C]];
                    else if (C == "shading") B.parameters[C] = B.parameters[C] == "flat" ? THREE.FlatShading : THREE.SmoothShading;
                else if (C == "blending") B.parameters[C] = THREE[B.parameters[C]] ? THREE[B.parameters[C]] : THREE.NormalBlending;
                else C == "combine" && (B.parameters[C] = B.parameters[C] == "MixOperation" ? THREE.MixOperation : THREE.MultiplyOperation);
                B = new THREE[B.type](B.parameters);
                F.materials[p] = B
            }
            j();
            d(F)
        }
    }
};
THREE.MarchingCubes = function(a, d) {
    THREE.Object3D.call(this);
    this.materials = d instanceof Array ? d : [d];
    this.init = function(b) {
        this.isolation = 80;
        this.size = b;
        this.size2 = this.size * this.size;
        this.size3 = this.size2 * this.size;
        this.halfsize = this.size / 2;
        this.delta = 2 / this.size;
        this.yd = this.size;
        this.zd = this.size2;
        this.field = new Float32Array(this.size3);
        this.normal_cache = new Float32Array(this.size3 * 3);
        this.vlist = new Float32Array(36);
        this.nlist = new Float32Array(36);
        this.firstDraw = !0;
        this.maxCount = 4096;
        this.count = 0;
        this.hasPos = !1;
        this.hasNormal = !1;
        this.positionArray = new Float32Array(this.maxCount * 3);
        this.normalArray = new Float32Array(this.maxCount * 3)
    };
    this.lerp = function(b, e, c) {
        return b + (e - b) * c
    };
    this.VIntX = function(b, e, c, f, g, h, j, l, k, m) {
        g = (g - k) / (m - k);
        k = this.normal_cache;
        e[f] = h + g * this.delta;
        e[f + 1] = j;
        e[f + 2] = l;
        c[f] = this.lerp(k[b], k[b + 3], g);
        c[f + 1] = this.lerp(k[b + 1], k[b + 4], g);
        c[f + 2] = this.lerp(k[b + 2], k[b + 5], g)
    };
    this.VIntY = function(b, e, c, f, g, h, j, l, k, m) {
        g = (g - k) / (m - k);
        k = this.normal_cache;
        e[f] = h;
        e[f + 1] = j + g * this.delta;
        e[f +
            2] = l;
        e = b + this.yd * 3;
        c[f] = this.lerp(k[b], k[e], g);
        c[f + 1] = this.lerp(k[b + 1], k[e + 1], g);
        c[f + 2] = this.lerp(k[b + 2], k[e + 2], g)
    };
    this.VIntZ = function(b, e, c, f, g, h, j, l, k, m) {
        g = (g - k) / (m - k);
        k = this.normal_cache;
        e[f] = h;
        e[f + 1] = j;
        e[f + 2] = l + g * this.delta;
        e = b + this.zd * 3;
        c[f] = this.lerp(k[b], k[e], g);
        c[f + 1] = this.lerp(k[b + 1], k[e + 1], g);
        c[f + 2] = this.lerp(k[b + 2], k[e + 2], g)
    };
    this.compNorm = function(b) {
        var e = b * 3;
        if (this.normal_cache[e] == 0) {
            this.normal_cache[e] = this.field[b - 1] - this.field[b + 1];
            this.normal_cache[e + 1] = this.field[b - this.yd] -
                this.field[b + this.yd];
            this.normal_cache[e + 2] = this.field[b - this.zd] - this.field[b + this.zd]
        }
    };
    this.polygonize = function(b, e, c, f, g, h) {
        var j = f + 1,
            l = f + this.yd,
            k = f + this.zd,
            m = j + this.yd,
            p = j + this.zd,
            o = f + this.yd + this.zd,
            x = j + this.yd + this.zd,
            w = 0,
            u = this.field[f],
            B = this.field[j],
            z = this.field[l],
            n = this.field[m],
            y = this.field[k],
            C = this.field[p],
            G = this.field[o],
            K = this.field[x];
        u < g && (w |= 1);
        B < g && (w |= 2);
        z < g && (w |= 8);
        n < g && (w |= 4);
        y < g && (w |= 16);
        C < g && (w |= 32);
        G < g && (w |= 128);
        K < g && (w |= 64);
        var J = THREE.edgeTable[w];
        if (J == 0) return 0;
        var I = this.delta,
            E = b + I,
            L = e + I;
        I = c + I;
        if (J & 1) {
            this.compNorm(f);
            this.compNorm(j);
            this.VIntX(f * 3, this.vlist, this.nlist, 0, g, b, e, c, u, B)
        }
        if (J & 2) {
            this.compNorm(j);
            this.compNorm(m);
            this.VIntY(j * 3, this.vlist, this.nlist, 3, g, E, e, c, B, n)
        }
        if (J & 4) {
            this.compNorm(l);
            this.compNorm(m);
            this.VIntX(l * 3, this.vlist, this.nlist, 6, g, b, L, c, z, n)
        }
        if (J & 8) {
            this.compNorm(f);
            this.compNorm(l);
            this.VIntY(f * 3, this.vlist, this.nlist, 9, g, b, e, c, u, z)
        }
        if (J & 16) {
            this.compNorm(k);
            this.compNorm(p);
            this.VIntX(k * 3, this.vlist, this.nlist, 12, g, b, e, I, y, C)
        }
        if (J & 32) {
            this.compNorm(p);
            this.compNorm(x);
            this.VIntY(p * 3, this.vlist, this.nlist, 15, g, E, e, I, C, K)
        }
        if (J & 64) {
            this.compNorm(o);
            this.compNorm(x);
            this.VIntX(o * 3, this.vlist, this.nlist, 18, g, b, L, I, G, K)
        }
        if (J & 128) {
            this.compNorm(k);
            this.compNorm(o);
            this.VIntY(k * 3, this.vlist, this.nlist, 21, g, b, e, I, y, G)
        }
        if (J & 256) {
            this.compNorm(f);
            this.compNorm(k);
            this.VIntZ(f * 3, this.vlist, this.nlist, 24, g, b, e, c, u, y)
        }
        if (J & 512) {
            this.compNorm(j);
            this.compNorm(p);
            this.VIntZ(j * 3, this.vlist, this.nlist, 27, g, E, e, c, B, C)
        }
        if (J & 1024) {
            this.compNorm(m);
            this.compNorm(x);
            this.VIntZ(m * 3, this.vlist, this.nlist, 30, g, E, L, c, n, K)
        }
        if (J & 2048) {
            this.compNorm(l);
            this.compNorm(o);
            this.VIntZ(l * 3, this.vlist, this.nlist, 33, g, b, L, c, z, G)
        }
        w <<= 4;
        for (g = f = 0; THREE.triTable[w + g] != -1;) {
            b = w + g;
            e = b + 1;
            c = b + 2;
            this.posnormtriv(this.vlist, this.nlist, 3 * THREE.triTable[b], 3 * THREE.triTable[e], 3 * THREE.triTable[c], h);
            g += 3;
            f++
        }
        return f
    };
    this.posnormtriv = function(b, e, c, f, g, h) {
        var j = this.count * 3;
        this.positionArray[j] = b[c];
        this.positionArray[j + 1] = b[c + 1];
        this.positionArray[j + 2] = b[c + 2];
        this.positionArray[j +
            3] = b[f];
        this.positionArray[j + 4] = b[f + 1];
        this.positionArray[j + 5] = b[f + 2];
        this.positionArray[j + 6] = b[g];
        this.positionArray[j + 7] = b[g + 1];
        this.positionArray[j + 8] = b[g + 2];
        this.normalArray[j] = e[c];
        this.normalArray[j + 1] = e[c + 1];
        this.normalArray[j + 2] = e[c + 2];
        this.normalArray[j + 3] = e[f];
        this.normalArray[j + 4] = e[f + 1];
        this.normalArray[j + 5] = e[f + 2];
        this.normalArray[j + 6] = e[g];
        this.normalArray[j + 7] = e[g + 1];
        this.normalArray[j + 8] = e[g + 2];
        this.hasPos = !0;
        this.hasNormal = !0;
        this.count += 3;
        this.count >= this.maxCount - 3 && h(this)
    };
    this.begin = function() {
        this.count = 0;
        this.hasPos = !1;
        this.hasNormal = !1
    };
    this.end = function(b) {
        if (this.count != 0) {
            for (var e = this.count * 3; e < this.positionArray.length; e++) this.positionArray[e] = 0;
            b(this)
        }
    };
    this.addBall = function(b, e, c, f, g) {
        var h = this.size * Math.sqrt(f / g),
            j = c * this.size,
            l = e * this.size,
            k = b * this.size,
            m = Math.floor(j - h);
        m < 1 && (m = 1);
        j = Math.floor(j + h);
        j > this.size - 1 && (j = this.size - 1);
        var p = Math.floor(l - h);
        p < 1 && (p = 1);
        l = Math.floor(l + h);
        l > this.size - 1 && (l = this.size - 1);
        var o = Math.floor(k - h);
        o < 1 && (o = 1);
        h = Math.floor(k + h);
        h > this.size - 1 && (h = this.size - 1);
        for (var x, w, u, B, z, n; m < j; m++) {
            k = this.size2 * m;
            w = m / this.size - c;
            z = w * w;
            for (w = p; w < l; w++) {
                u = k + this.size * w;
                x = w / this.size - e;
                n = x * x;
                for (x = o; x < h; x++) {
                    B = x / this.size - b;
                    B = f / (1.0E-6 + B * B + n + z) - g;
                    B > 0 && (this.field[u + x] += B)
                }
            }
        }
    };
    this.addPlaneX = function(b, e) {
        var c, f, g, h, j, l = this.size,
            k = this.yd,
            m = this.zd,
            p = this.field,
            o = l * Math.sqrt(b / e);
        o > l && (o = l);
        for (c = 0; c < o; c++) {
            f = c / l;
            f *= f;
            h = b / (1.0E-4 + f) - e;
            if (h > 0)
                for (f = 0; f < l; f++) {
                    j = c + f * k;
                    for (g = 0; g < l; g++) p[m * g + j] += h
                }
        }
    };
    this.addPlaneY = function(b, e) {
        var c, f, g, h, j, l, k = this.size,
            m = this.yd,
            p = this.zd,
            o = this.field,
            x = k * Math.sqrt(b / e);
        x > k && (x = k);
        for (f = 0; f < x; f++) {
            c = f / k;
            c *= c;
            h = b / (1.0E-4 + c) - e;
            if (h > 0) {
                j = f * m;
                for (c = 0; c < k; c++) {
                    l = j + c;
                    for (g = 0; g < k; g++) o[p * g + l] += h
                }
            }
        }
    };
    this.addPlaneZ = function(b, e) {
        var c, f, g, h, j, l;
        size = this.size;
        yd = this.yd;
        zd = this.zd;
        field = this.field;
        dist = size * Math.sqrt(b / e);
        dist > size && (dist = size);
        for (g = 0; g < dist; g++) {
            c = g / size;
            c *= c;
            h = b / (1.0E-4 + c) - e;
            if (h > 0) {
                j = zd * g;
                for (f = 0; f < size; f++) {
                    l = j + f * yd;
                    for (c = 0; c < size; c++) field[l + c] += h
                }
            }
        }
    };
    this.reset = function() {
        var b;
        for (b = 0; b < this.size3; b++) {
            this.normal_cache[b * 3] = 0;
            this.field[b] = 0
        }
    };
    this.render = function(b) {
        this.begin();
        var e, c, f, g, h, j, l, k, m, p = this.size - 2;
        for (g = 1; g < p; g++) {
            m = this.size2 * g;
            l = (g - this.halfsize) / this.halfsize;
            for (f = 1; f < p; f++) {
                k = m + this.size * f;
                j = (f - this.halfsize) / this.halfsize;
                for (c = 1; c < p; c++) {
                    h = (c - this.halfsize) / this.halfsize;
                    e = k + c;
                    this.polygonize(h, j, l, e, this.isolation, b)
                }
            }
        }
        this.end(b)
    };
    this.generateGeometry = function() {
        var b = 0,
            e = new THREE.Geometry,
            c = [];
        this.render(function(f) {
            var g, h, j, l, k, m, p, o;
            for (g = 0; g < f.count; g++) {
                p = g * 3;
                k = p + 1;
                o = p + 2;
                h = f.positionArray[p];
                j = f.positionArray[k];
                l = f.positionArray[o];
                m = new THREE.Vector3(h, j, l);
                h = f.normalArray[p];
                j = f.normalArray[k];
                l = f.normalArray[o];
                p = new THREE.Vector3(h, j, l);
                p.normalize();
                k = new THREE.Vertex(m);
                e.vertices.push(k);
                c.push(p)
            }
            nfaces = f.count / 3;
            for (g = 0; g < nfaces; g++) {
                p = (b + g) * 3;
                k = p + 1;
                o = p + 2;
                m = c[p];
                h = c[k];
                j = c[o];
                p = new THREE.Face3(p, k, o, [m, h, j]);
                e.faces.push(p)
            }
            b += nfaces;
            f.count = 0
        });
        return e
    };
    this.init(a)
};
THREE.MarchingCubes.prototype = new THREE.Object3D;
THREE.MarchingCubes.prototype.constructor = THREE.MarchingCubes;
THREE.edgeTable = new Int32Array([0, 265, 515, 778, 1030, 1295, 1541, 1804, 2060, 2309, 2575, 2822, 3082, 3331, 3593, 3840, 400, 153, 915, 666, 1430, 1183, 1941, 1692, 2460, 2197, 2975, 2710, 3482, 3219, 3993, 3728, 560, 825, 51, 314, 1590, 1855, 1077, 1340, 2620, 2869, 2111, 2358, 3642, 3891, 3129, 3376, 928, 681, 419, 170, 1958, 1711, 1445, 1196, 2988, 2725, 2479, 2214, 4010, 3747, 3497, 3232, 1120, 1385, 1635, 1898, 102, 367, 613, 876, 3180, 3429, 3695, 3942, 2154, 2403, 2665, 2912, 1520, 1273, 2035, 1786, 502, 255, 1013, 764, 3580, 3317, 4095, 3830, 2554, 2291, 3065, 2800, 1616, 1881, 1107, 1370, 598, 863, 85, 348, 3676, 3925, 3167, 3414, 2650, 2899, 2137, 2384, 1984, 1737, 1475, 1226, 966, 719, 453, 204, 4044, 3781, 3535, 3270, 3018, 2755, 2505, 2240, 2240, 2505, 2755, 3018, 3270, 3535, 3781, 4044, 204, 453, 719, 966, 1226, 1475, 1737, 1984, 2384, 2137, 2899, 2650, 3414, 3167, 3925, 3676, 348, 85, 863, 598, 1370, 1107, 1881, 1616, 2800, 3065, 2291, 2554, 3830, 4095, 3317, 3580, 764, 1013, 255, 502, 1786, 2035, 1273, 1520, 2912, 2665, 2403, 2154, 3942, 3695, 3429, 3180, 876, 613, 367, 102, 1898, 1635, 1385, 1120, 3232, 3497, 3747, 4010, 2214, 2479, 2725, 2988, 1196, 1445, 1711, 1958, 170, 419, 681, 928, 3376, 3129, 3891, 3642, 2358, 2111, 2869, 2620, 1340, 1077, 1855, 1590, 314, 51, 825, 560, 3728, 3993, 3219, 3482, 2710, 2975, 2197, 2460, 1692, 1941, 1183, 1430, 666, 915, 153, 400, 3840, 3593, 3331, 3082, 2822, 2575, 2309, 2060, 1804, 1541, 1295, 1030, 778, 515, 265, 0]);
THREE.triTable = new Int32Array([-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 1, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1, 8, 3, 9, 8, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 8, 3, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 9, 2, 10, 0, 2, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 2, 8, 3, 2, 10, 8, 10, 9, 8, -1, -1, -1, -1, -1, -1, -1, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 11, 2, 8, 11, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1, 9, 0, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1, 11, 2, 1, 9, 11, 9, 8, 11, -1, -1, -1, -1, -1, -1, -1, 3, 10, 1, 11, 10, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 10, 1, 0, 8, 10, 8, 11, 10, -1, -1, -1, -1, -1, -1, -1, 3, 9, 0, 3, 11, 9, 11, 10, 9, -1, -1, -1, -1, -1, -1, -1, 9, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 4, 3, 0, 7, 3, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 1, 9, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 4, 1, 9, 4, 7, 1, 7, 3, 1, -1, -1, -1, -1, -1, -1, -1, 1, 2, 10, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 3, 4, 7, 3, 0, 4, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1, 9, 2, 10, 9, 0, 2, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, 2, 10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4, -1, -1, -1, -1, 8, 4, 7, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 11, 4, 7, 11, 2, 4, 2, 0, 4, -1, -1, -1, -1, -1, -1, -1, 9, 0, 1, 8, 4, 7, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, 4, 7, 11, 9, 4, 11, 9, 11, 2, 9, 2, 1, -1, -1, -1, -1, 3, 10, 1, 3, 11, 10, 7, 8, 4, -1, -1, -1, -1, -1, -1, -1, 1, 11, 10, 1, 4, 11, 1, 0, 4, 7, 11, 4, -1, -1, -1, -1, 4, 7, 8, 9, 0, 11, 9, 11, 10, 11, 0, 3, -1, -1, -1, -1, 4, 7, 11, 4, 11, 9, 9, 11, 10, -1, -1, -1, -1, -1, -1, -1, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 9, 5, 4, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 5, 4, 1, 5, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 8, 5, 4, 8, 3, 5, 3, 1, 5, -1, -1, -1, -1, -1, -1, -1, 1, 2, 10, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 3, 0, 8, 1, 2, 10, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1, 5, 2, 10, 5, 4, 2, 4, 0, 2, -1, -1, -1, -1, -1, -1, -1, 2, 10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8, -1, -1, -1, -1, 9, 5, 4, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 11, 2, 0, 8, 11, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1, 0, 5, 4, 0, 1, 5, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, 2, 1, 5, 2, 5, 8, 2, 8, 11, 4, 8, 5, -1, -1, -1, -1, 10, 3, 11, 10, 1, 3, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1, 4, 9, 5, 0, 8, 1, 8, 10, 1, 8, 11, 10, -1, -1, -1, -1, 5, 4, 0, 5, 0, 11, 5, 11, 10, 11, 0, 3, -1, -1, -1, -1, 5, 4, 8, 5, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1, 9, 7, 8, 5, 7, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 9, 3, 0, 9, 5, 3, 5, 7, 3, -1, -1, -1, -1, -1, -1, -1, 0, 7, 8, 0, 1, 7, 1, 5, 7, -1, -1, -1, -1, -1, -1, -1, 1, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 9, 7, 8, 9, 5, 7, 10, 1, 2, -1, -1, -1, -1, -1, -1, -1, 10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3, -1, -1, -1, -1, 8, 0, 2, 8, 2, 5, 8, 5, 7, 10, 5, 2, -1, -1, -1, -1, 2, 10, 5, 2, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1, 7, 9, 5, 7, 8, 9, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1, 9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7, 11, -1, -1, -1, -1, 2, 3, 11, 0, 1, 8, 1, 7, 8, 1, 5, 7, -1, -1, -1, -1, 11, 2, 1, 11, 1, 7, 7, 1, 5, -1, -1, -1, -1, -1, -1, -1, 9, 5, 8, 8, 5, 7, 10, 1, 3, 10, 3, 11, -1, -1, -1, -1, 5, 7, 0, 5, 0, 9, 7, 11, 0, 1, 0, 10, 11, 10, 0, -1, 11, 10, 0, 11, 0, 3, 10, 5, 0, 8, 0, 7, 5, 7, 0, -1, 11, 10, 5, 7, 11, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 8, 3, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 9, 0, 1, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1, 8, 3, 1, 9, 8, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, 1, 6, 5, 2, 6, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1, 6, 5, 1, 2, 6, 3, 0, 8, -1, -1, -1, -1, -1, -1, -1, 9, 6, 5, 9, 0, 6, 0, 2, 6, -1, -1, -1, -1, -1, -1, -1, 5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8, -1, -1, -1, -1, 2, 3, 11, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 11, 0, 8, 11, 2, 0, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1, 0, 1, 9, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, 5, 10, 6, 1, 9, 2, 9, 11, 2, 9, 8, 11, -1, -1, -1, -1, 6, 3, 11, 6, 5, 3, 5, 1, 3, -1, -1, -1, -1, -1, -1, -1, 0, 8, 11, 0, 11, 5, 0, 5, 1, 5, 11, 6, -1, -1, -1, -1, 3, 11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9, -1, -1, -1, -1, 6, 5, 9, 6, 9, 11, 11, 9, 8, -1, -1, -1, -1, -1, -1, -1, 5, 10, 6, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 4, 3, 0, 4, 7, 3, 6, 5, 10, -1, -1, -1, -1, -1, -1, -1, 1, 9, 0, 5, 10, 6, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, 10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4, -1, -1, -1, -1, 6, 1, 2, 6, 5, 1, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1, 1, 2, 5, 5, 2, 6, 3, 0, 4, 3, 4, 7, -1, -1, -1, -1, 8, 4, 7, 9, 0, 5, 0, 6, 5, 0, 2, 6, -1, -1, -1, -1, 7, 3, 9, 7, 9, 4, 3, 2, 9, 5, 9, 6, 2, 6, 9, -1, 3, 11, 2, 7, 8, 4, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1, 5, 10, 6, 4, 7, 2, 4, 2, 0, 2, 7, 11, -1, -1, -1, -1, 0, 1, 9, 4, 7, 8, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1, 9, 2, 1, 9, 11, 2, 9, 4, 11, 7, 11, 4, 5, 10, 6, -1, 8, 4, 7, 3, 11, 5, 3, 5, 1, 5, 11, 6, -1, -1, -1, -1, 5, 1, 11, 5, 11, 6, 1, 0, 11, 7, 11, 4, 0, 4, 11, -1, 0, 5, 9, 0, 6, 5, 0, 3, 6, 11, 6, 3, 8, 4, 7, -1, 6, 5, 9, 6, 9, 11, 4, 7, 9, 7, 11, 9, -1, -1, -1, -1, 10, 4, 9, 6, 4, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 4, 10, 6, 4, 9, 10, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1, 10, 0, 1, 10, 6, 0, 6, 4, 0, -1, -1, -1, -1, -1, -1, -1, 8, 3, 1, 8, 1, 6, 8, 6, 4, 6, 1, 10, -1, -1, -1, -1, 1, 4, 9, 1, 2, 4, 2, 6, 4, -1, -1, -1, -1, -1, -1, -1, 3, 0, 8, 1, 2, 9, 2, 4, 9, 2, 6, 4, -1, -1, -1, -1, 0, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 8, 3, 2, 8, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1, 10, 4, 9, 10, 6, 4, 11, 2, 3, -1, -1, -1, -1, -1, -1, -1, 0, 8, 2, 2, 8, 11, 4, 9, 10, 4, 10, 6, -1, -1, -1, -1, 3, 11, 2, 0, 1, 6, 0, 6, 4, 6, 1, 10, -1, -1, -1, -1, 6, 4, 1, 6, 1, 10, 4, 8, 1, 2, 1, 11, 8, 11, 1, -1, 9, 6, 4, 9, 3, 6, 9, 1, 3, 11, 6, 3, -1, -1, -1, -1, 8, 11, 1, 8, 1, 0, 11, 6, 1, 9, 1, 4, 6, 4, 1, -1, 3, 11, 6, 3, 6, 0, 0, 6, 4, -1, -1, -1, -1, -1, -1, -1, 6, 4, 8, 11, 6, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 7, 10, 6, 7, 8, 10, 8, 9, 10, -1, -1, -1, -1, -1, -1, -1, 0, 7, 3, 0, 10, 7, 0, 9, 10, 6, 7, 10, -1, -1, -1, -1, 10, 6, 7, 1, 10, 7, 1, 7, 8, 1, 8, 0, -1, -1, -1, -1, 10, 6, 7, 10, 7, 1, 1, 7, 3, -1, -1, -1, -1, -1, -1, -1, 1, 2, 6, 1, 6, 8, 1, 8, 9, 8, 6, 7, -1, -1, -1, -1, 2, 6, 9, 2, 9, 1, 6, 7, 9, 0, 9, 3, 7, 3, 9, -1, 7, 8, 0, 7, 0, 6, 6, 0, 2, -1, -1, -1, -1, -1, -1, -1, 7, 3, 2, 6, 7, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 2, 3, 11, 10, 6, 8, 10, 8, 9, 8, 6, 7, -1, -1, -1, -1, 2, 0, 7, 2, 7, 11, 0, 9, 7, 6, 7, 10, 9, 10, 7, -1, 1, 8, 0, 1, 7, 8, 1, 10, 7, 6, 7, 10, 2, 3, 11, -1, 11, 2, 1, 11, 1, 7, 10, 6, 1, 6, 7, 1, -1, -1, -1, -1, 8, 9, 6, 8, 6, 7, 9, 1, 6, 11, 6, 3, 1, 3, 6, -1, 0, 9, 1, 11, 6, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 7, 8, 0, 7, 0, 6, 3, 11, 0, 11, 6, 0, -1, -1, -1, -1, 7, 11, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 3, 0, 8, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 1, 9, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 8, 1, 9, 8, 3, 1, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, 10, 1, 2, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1, 2, 10, 3, 0, 8, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1, 2, 9, 0, 2, 10, 9, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1, 6, 11, 7, 2, 10, 3, 10, 8, 3, 10, 9, 8, -1, -1, -1, -1, 7, 2, 3, 6, 2, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 7, 0, 8, 7, 6, 0, 6, 2, 0, -1, -1, -1, -1, -1, -1, -1, 2, 7, 6, 2, 3, 7, 0, 1, 9, -1, -1, -1, -1, -1, -1, -1, 1, 6, 2, 1, 8, 6, 1, 9, 8, 8, 7, 6, -1, -1, -1, -1, 10, 7, 6, 10, 1, 7, 1, 3, 7, -1, -1, -1, -1, -1, -1, -1, 10, 7, 6, 1, 7, 10, 1, 8, 7, 1, 0, 8, -1, -1, -1, -1, 0, 3, 7, 0, 7, 10, 0, 10, 9, 6, 10, 7, -1, -1, -1, -1, 7, 6, 10, 7, 10, 8, 8, 10, 9, -1, -1, -1, -1, -1, -1, -1, 6, 8, 4, 11, 8, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 3, 6, 11, 3, 0, 6, 0, 4, 6, -1, -1, -1, -1, -1, -1, -1, 8, 6, 11, 8, 4, 6, 9, 0, 1, -1, -1, -1, -1, -1, -1, -1, 9, 4, 6, 9, 6, 3, 9, 3, 1, 11, 3, 6, -1, -1, -1, -1, 6, 8, 4, 6, 11, 8, 2, 10, 1, -1, -1, -1, -1, -1, -1, -1, 1, 2, 10, 3, 0, 11, 0, 6, 11, 0, 4, 6, -1, -1, -1, -1, 4, 11, 8, 4, 6, 11, 0, 2, 9, 2, 10, 9, -1, -1, -1, -1, 10, 9, 3, 10, 3, 2, 9, 4, 3, 11, 3, 6, 4, 6, 3, -1, 8, 2, 3, 8, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1, 0, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1, 9, 0, 2, 3, 4, 2, 4, 6, 4, 3, 8, -1, -1, -1, -1, 1, 9, 4, 1, 4, 2, 2, 4, 6, -1, -1, -1, -1, -1, -1, -1, 8, 1, 3, 8, 6, 1, 8, 4, 6, 6, 10, 1, -1, -1, -1, -1, 10, 1, 0, 10, 0, 6, 6, 0, 4, -1, -1, -1, -1, -1, -1, -1, 4, 6, 3, 4, 3, 8, 6, 10, 3, 0, 3, 9, 10, 9, 3, -1, 10, 9, 4, 6, 10, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 4, 9, 5, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 8, 3, 4, 9, 5, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, 5, 0, 1, 5, 4, 0, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1, 11, 7, 6, 8, 3, 4, 3, 5, 4, 3, 1, 5, -1, -1, -1, -1, 9, 5, 4, 10, 1, 2, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1, 6, 11, 7, 1, 2, 10, 0, 8, 3, 4, 9, 5, -1, -1, -1, -1, 7, 6, 11, 5, 4, 10, 4, 2, 10, 4, 0, 2, -1, -1, -1, -1, 3, 4, 8, 3, 5, 4, 3, 2, 5, 10, 5, 2, 11, 7, 6, -1, 7, 2, 3, 7, 6, 2, 5, 4, 9, -1, -1, -1, -1, -1, -1, -1, 9, 5, 4, 0, 8, 6, 0, 6, 2, 6, 8, 7, -1, -1, -1, -1, 3, 6, 2, 3, 7, 6, 1, 5, 0, 5, 4, 0, -1, -1, -1, -1, 6, 2, 8, 6, 8, 7, 2, 1, 8, 4, 8, 5, 1, 5, 8, -1, 9, 5, 4, 10, 1, 6, 1, 7, 6, 1, 3, 7, -1, -1, -1, -1, 1, 6, 10, 1, 7, 6, 1, 0, 7, 8, 7, 0, 9, 5, 4, -1, 4, 0, 10, 4, 10, 5, 0, 3, 10, 6, 10, 7, 3, 7, 10, -1, 7, 6, 10, 7, 10, 8, 5, 4, 10, 4, 8, 10, -1, -1, -1, -1, 6, 9, 5, 6, 11, 9, 11, 8, 9, -1, -1, -1, -1, -1, -1, -1, 3, 6, 11, 0, 6, 3, 0, 5, 6, 0, 9, 5, -1, -1, -1, -1, 0, 11, 8, 0, 5, 11, 0, 1, 5, 5, 6, 11, -1, -1, -1, -1, 6, 11, 3, 6, 3, 5, 5, 3, 1, -1, -1, -1, -1, -1, -1, -1, 1, 2, 10, 9, 5, 11, 9, 11, 8, 11, 5, 6, -1, -1, -1, -1, 0, 11, 3, 0, 6, 11, 0, 9, 6, 5, 6, 9, 1, 2, 10, -1, 11, 8, 5, 11, 5, 6, 8, 0, 5, 10, 5, 2, 0, 2, 5, -1, 6, 11, 3, 6, 3, 5, 2, 10, 3, 10, 5, 3, -1, -1, -1, -1, 5, 8, 9, 5, 2, 8, 5, 6, 2, 3, 8, 2, -1, -1, -1, -1, 9, 5, 6, 9, 6, 0, 0, 6, 2, -1, -1, -1, -1, -1, -1, -1, 1, 5, 8, 1, 8, 0, 5, 6, 8, 3, 8, 2, 6, 2, 8, -1, 1, 5, 6, 2, 1, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1, 3, 6, 1, 6, 10, 3, 8, 6, 5, 6, 9, 8, 9, 6, -1, 10, 1, 0, 10, 0, 6, 9, 5, 0, 5, 6, 0, -1, -1, -1, -1, 0, 3, 8, 5, 6, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 10, 5, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 11, 5, 10, 7, 5, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 11, 5, 10, 11, 7, 5, 8, 3, 0, -1, -1, -1, -1, -1, -1, -1, 5, 11, 7, 5, 10, 11, 1, 9, 0, -1, -1, -1, -1, -1, -1, -1, 10, 7, 5, 10, 11, 7, 9, 8, 1, 8, 3, 1, -1, -1, -1, -1, 11, 1, 2, 11, 7, 1, 7, 5, 1, -1, -1, -1, -1, -1, -1, -1, 0, 8, 3, 1, 2, 7, 1, 7, 5, 7, 2, 11, -1, -1, -1, -1, 9, 7, 5, 9, 2, 7, 9, 0, 2, 2, 11, 7, -1, -1, -1, -1, 7, 5, 2, 7, 2, 11, 5, 9, 2, 3, 2, 8, 9, 8, 2, -1, 2, 5, 10, 2, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1, 8, 2, 0, 8, 5, 2, 8, 7, 5, 10, 2, 5, -1, -1, -1, -1, 9, 0, 1, 5, 10, 3, 5, 3, 7, 3, 10, 2, -1, -1, -1, -1, 9, 8, 2, 9, 2, 1, 8, 7, 2, 10, 2, 5, 7, 5, 2, -1, 1, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 8, 7, 0, 7, 1, 1, 7, 5, -1, -1, -1, -1, -1, -1, -1, 9, 0, 3, 9, 3, 5, 5, 3, 7, -1, -1, -1, -1, -1, -1, -1, 9, 8, 7, 5, 9, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 5, 8, 4, 5, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1, 5, 0, 4, 5, 11, 0, 5, 10, 11, 11, 3, 0, -1, -1, -1, -1, 0, 1, 9, 8, 4, 10, 8, 10, 11, 10, 4, 5, -1, -1, -1, -1, 10, 11, 4, 10, 4, 5, 11, 3, 4, 9, 4, 1, 3, 1, 4, -1, 2, 5, 1, 2, 8, 5, 2, 11, 8, 4, 5, 8, -1, -1, -1, -1, 0, 4, 11, 0, 11, 3, 4, 5, 11, 2, 11, 1, 5, 1, 11, -1, 0, 2, 5, 0, 5, 9, 2, 11, 5, 4, 5, 8, 11, 8, 5, -1, 9, 4, 5, 2, 11, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 2, 5, 10, 3, 5, 2, 3, 4, 5, 3, 8, 4, -1, -1, -1, -1, 5, 10, 2, 5, 2, 4, 4, 2, 0, -1, -1, -1, -1, -1, -1, -1, 3, 10, 2, 3, 5, 10, 3, 8, 5, 4, 5, 8, 0, 1, 9, -1, 5, 10, 2, 5, 2, 4, 1, 9, 2, 9, 4, 2, -1, -1, -1, -1, 8, 4, 5, 8, 5, 3, 3, 5, 1, -1, -1, -1, -1, -1, -1, -1, 0, 4, 5, 1, 0, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 8, 4, 5, 8, 5, 3, 9, 0, 5, 0, 3, 5, -1, -1, -1, -1, 9, 4, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 4, 11, 7, 4, 9, 11, 9, 10, 11, -1, -1, -1, -1, -1, -1, -1, 0, 8, 3, 4, 9, 7, 9, 11, 7, 9, 10, 11, -1, -1, -1, -1, 1, 10, 11, 1, 11, 4, 1, 4, 0, 7, 4, 11, -1, -1, -1, -1, 3, 1, 4, 3, 4, 8, 1, 10, 4, 7, 4, 11, 10, 11, 4, -1, 4, 11, 7, 9, 11, 4, 9, 2, 11, 9, 1, 2, -1, -1, -1, -1, 9, 7, 4, 9, 11, 7, 9, 1, 11, 2, 11, 1, 0, 8, 3, -1, 11, 7, 4, 11, 4, 2, 2, 4, 0, -1, -1, -1, -1, -1, -1, -1, 11, 7, 4, 11, 4, 2, 8, 3, 4, 3, 2, 4, -1, -1, -1, -1, 2, 9, 10, 2, 7, 9, 2, 3, 7, 7, 4, 9, -1, -1, -1, -1, 9, 10, 7, 9, 7, 4, 10, 2, 7, 8, 7, 0, 2, 0, 7, -1, 3, 7, 10, 3, 10, 2, 7, 4, 10, 1, 10, 0, 4, 0, 10, -1, 1, 10, 2, 8, 7, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 4, 9, 1, 4, 1, 7, 7, 1, 3, -1, -1, -1, -1, -1, -1, -1, 4, 9, 1, 4, 1, 7, 0, 8, 1, 8, 7, 1, -1, -1, -1, -1, 4, 0, 3, 7, 4, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 4, 8, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 9, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 3, 0, 9, 3, 9, 11, 11, 9, 10, -1, -1, -1, -1, -1, -1, -1, 0, 1, 10, 0, 10, 8, 8, 10, 11, -1, -1, -1, -1, -1, -1, -1, 3, 1, 10, 11, 3, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1, 2, 11, 1, 11, 9, 9, 11, 8, -1, -1, -1, -1, -1, -1, -1, 3, 0, 9, 3, 9, 11, 1, 2, 9, 2, 11, 9, -1, -1, -1, -1, 0, 2, 11, 8, 0, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 3, 2, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 2, 3, 8, 2, 8, 10, 10, 8, 9, -1, -1, -1, -1, -1, -1, -1, 9, 10, 2, 0, 9, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 2, 3, 8, 2, 8, 10, 0, 1, 8, 1, 10, 8, -1, -1, -1, -1, 1, 10, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1, 3, 8, 9, 1, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 9, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 3, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]);
THREE.PlaneCollider = function(a, d) {
    this.point = a;
    this.normal = d
};
THREE.SphereCollider = function(a, d) {
    this.center = a;
    this.radius = d;
    this.radiusSq = d * d
};
THREE.BoxCollider = function(a, d) {
    this.min = a;
    this.max = d;
    this.dynamic = !0
};
THREE.MeshCollider = function(a, d, b, e) {
    this.vertices = a;
    this.faces = d;
    this.normals = b;
    this.box = e;
    this.numFaces = this.faces.length
};
THREE.CollisionSystem = function() {
    this.colliders = [];
    this.hits = []
};
THREE.Collisions = new THREE.CollisionSystem;
THREE.CollisionSystem.prototype.rayCastAll = function(a) {
    a.direction.normalize();
    this.hits.length = 0;
    var d, b, e, c, f = 0;
    d = 0;
    for (b = this.colliders.length; d < b; d++) {
        c = this.colliders[d];
        e = this.rayCast(a, c);
        if (e < Number.MAX_VALUE) {
            c.distance = e;
            e > f ? this.hits.push(c) : this.hits.unshift(c);
            f = e
        }
    }
    return this.hits
};
THREE.CollisionSystem.prototype.rayCastNearest = function(a) {
    var d = this.rayCastAll(a);
    if (d.length == 0) return null;
    for (var b = 0; d[b] instanceof THREE.MeshCollider;) {
        var e = this.rayMesh(a, d[b]);
        if (e < Number.MAX_VALUE) {
            d[b].distance = e;
            break
        }
        b++
    }
    if (b > d.length) return null;
    return d[b]
};
THREE.CollisionSystem.prototype.rayCast = function(a, d) {
    if (d instanceof THREE.PlaneCollider) return this.rayPlane(a, d);
    else if (d instanceof THREE.SphereCollider) return this.raySphere(a, d);
    else if (d instanceof THREE.BoxCollider) return this.rayBox(a, d);
    else if (d instanceof THREE.MeshCollider && d.box) return this.rayBox(a, d.box)
};
THREE.CollisionSystem.prototype.rayMesh = function(a, d) {
    for (var b = this.makeRayLocal(a, d.mesh), e = Number.MAX_VALUE, c = 0; c < d.numFaces / 3; c++) {
        var f = c * 3;
        e = Math.min(e, this.rayTriangle(b, d.vertices[d.faces[f + 0]], d.vertices[d.faces[f + 1]], d.vertices[d.faces[f + 2]], d.normals[d.faces[c]], e))
    }
    return e
};
THREE.CollisionSystem.prototype.rayTriangle = function(a, d, b, e, c, f) {
    var g = THREE.CollisionSystem.__v1,
        h = THREE.CollisionSystem.__v2;
    g.sub(b, d);
    h.sub(e, b);
    c.cross(g, h);
    h = c.dot(a.direction);
    if (!(h < 0)) return Number.MAX_VALUE;
    g = c.dot(d) - c.dot(a.origin);
    if (!(g <= 0)) return Number.MAX_VALUE;
    if (!(g >= h * f)) return Number.MAX_VALUE;
    g /= h;
    h = THREE.CollisionSystem.__v3;
    h.copy(a.direction);
    h.multiplyScalar(g);
    h.addSelf(a.origin);
    if (Math.abs(c.x) > Math.abs(c.y))
        if (Math.abs(c.x) > Math.abs(c.z)) {
            a = h.y - d.y;
            c = b.y - d.y;
            f = e.y - d.y;
            h = h.z - d.z;
            b = b.z - d.z;
            e = e.z - d.z
        } else {
            a = h.x - d.x;
            c = b.x - d.x;
            f = e.x - d.x;
            h = h.y - d.y;
            b = b.y - d.y;
            e = e.y - d.y
        }
    else if (Math.abs(c.y) > Math.abs(c.z)) {
        a = h.x - d.x;
        c = b.x - d.x;
        f = e.x - d.x;
        h = h.z - d.z;
        b = b.z - d.z;
        e = e.z - d.z
    } else {
        a = h.x - d.x;
        c = b.x - d.x;
        f = e.x - d.x;
        h = h.y - d.y;
        b = b.y - d.y;
        e = e.y - d.y
    }
    d = c * e - b * f;
    if (d == 0) return Number.MAX_VALUE;
    d = 1 / d;
    e = (a * e - h * f) * d;
    if (!(e >= 0)) return Number.MAX_VALUE;
    d *= c * h - b * a;
    if (!(d >= 0)) return Number.MAX_VALUE;
    if (!(1 - e - d >= 0)) return Number.MAX_VALUE;
    return g
};
THREE.CollisionSystem.prototype.makeRayLocal = function(a, d) {
    var b = new THREE.Ray(a.origin.clone(), a.direction.clone()),
        e = THREE.Matrix4.makeInvert(d.matrixWorld);
    e.multiplyVector3(b.origin);
    e.rotateAxis(b.direction);
    b.direction.normalize();
    return b
};
THREE.CollisionSystem.prototype.rayBox = function(a, d) {
    var b;
    b = d.dynamic && d.mesh && d.mesh.matrixWorld ? this.makeRayLocal(a, d.mesh) : new THREE.Ray(a.origin.clone(), a.direction.clone());
    var e = 0,
        c = 0,
        f = 0,
        g = 0,
        h = 0,
        j = 0,
        l = !0;
    if (b.origin.x < d.min.x) {
        e = d.min.x - b.origin.x;
        e /= b.direction.x;
        l = !1;
        g = -1
    } else if (b.origin.x > d.max.x) {
        e = d.max.x - b.origin.x;
        e /= b.direction.x;
        l = !1;
        g = 1
    }
    if (b.origin.y < d.min.y) {
        c = d.min.y - b.origin.y;
        c /= b.direction.y;
        l = !1;
        h = -1
    } else if (b.origin.y > d.max.y) {
        c = d.max.y - b.origin.y;
        c /= b.direction.y;
        l = !1;
        h = 1
    }
    if (b.origin.z < d.min.z) {
        f = d.min.z - b.origin.z;
        f /= b.direction.z;
        l = !1;
        j = -1
    } else if (b.origin.z > d.max.z) {
        f = d.max.z - b.origin.z;
        f /= b.direction.z;
        l = !1;
        j = 1
    }
    if (l) return -1;
    l = 0;
    if (c > e) {
        l = 1;
        e = c
    }
    if (f > e) {
        l = 2;
        e = f
    }
    switch (l) {
        case 0:
            h = b.origin.y + b.direction.y * e;
            if (h < d.min.y || h > d.max.y) return Number.MAX_VALUE;
            b = b.origin.z + b.direction.z * e;
            if (b < d.min.z || b > d.max.z) return Number.MAX_VALUE;
            d.normal = new THREE.Vector3(g, 0, 0);
            break;
        case 1:
            g = b.origin.x + b.direction.x * e;
            if (g < d.min.x || g > d.max.x) return Number.MAX_VALUE;
            b = b.origin.z +
                b.direction.z * e;
            if (b < d.min.z || b > d.max.z) return Number.MAX_VALUE;
            d.normal = new THREE.Vector3(0, h, 0);
            break;
        case 2:
            g = b.origin.x + b.direction.x * e;
            if (g < d.min.x || g > d.max.x) return Number.MAX_VALUE;
            h = b.origin.y + b.direction.y * e;
            if (h < d.min.y || h > d.max.y) return Number.MAX_VALUE;
            d.normal = new THREE.Vector3(0, 0, j)
    }
    return e
};
THREE.CollisionSystem.prototype.rayPlane = function(a, d) {
    var b = a.direction.dot(d.normal),
        e = d.point.dot(d.normal);
    if (b < 0) b = (e - a.origin.dot(d.normal)) / b;
    else return Number.MAX_VALUE;
    return b > 0 ? b : Number.MAX_VALUE
};
THREE.CollisionSystem.prototype.raySphere = function(a, d) {
    var b = d.center.clone().subSelf(a.origin);
    if (b.lengthSq < d.radiusSq) return -1;
    var e = b.dot(a.direction.clone());
    if (e <= 0) return Number.MAX_VALUE;
    b = d.radiusSq - (b.lengthSq() - e * e);
    if (b >= 0) return Math.abs(e) - Math.sqrt(b);
    return Number.MAX_VALUE
};
THREE.CollisionSystem.__v1 = new THREE.Vector3;
THREE.CollisionSystem.__v2 = new THREE.Vector3;
THREE.CollisionSystem.__v3 = new THREE.Vector3;
THREE.CollisionUtils = {};
THREE.CollisionUtils.MeshOBB = function(a) {
    a.geometry.computeBoundingBox();
    var d = a.geometry.boundingBox,
        b = new THREE.Vector3(d.x[0], d.y[0], d.z[0]);
    d = new THREE.Vector3(d.x[1], d.y[1], d.z[1]);
    b = new THREE.BoxCollider(b, d);
    b.mesh = a;
    return b
};
THREE.CollisionUtils.MeshAABB = function(a) {
    var d = THREE.CollisionUtils.MeshOBB(a);
    d.min.addSelf(a.position);
    d.max.addSelf(a.position);
    d.dynamic = !1;
    return d
};
THREE.CollisionUtils.MeshColliderWBox = function(a) {
    for (var d = a.geometry.vertices, b = d.length, e = a.geometry.faces, c = e.length, f = [], g = [], h = [], j = 0; j < b; j++) f.push(new THREE.Vector3(d[j].position.x, d[j].position.y, d[j].position.z));
    for (j = 0; j < c; j++) {
        g.push(e[j].a, e[j].b, e[j].c);
        h.push(new THREE.Vector3(e[j].normal.x, e[j].normal.y, e[j].normal.z))
    }
    d = new THREE.MeshCollider(f, g, h, THREE.CollisionUtils.MeshOBB(a));
    d.mesh = a;
    return d
};