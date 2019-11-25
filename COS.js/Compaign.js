import * as THREE from './three.js/three.module.js';
import { MTLLoader } from './three.js/MTLLoader.js';
import { OBJLoader } from './three.js/OBJLoader.js';
import { Character } from './Character.js';
import { Accessory } from './Accessory.js';
import { Territory } from './Territory.js';
//import{territory}

var Compaign=( function(){
    function Compaign(storyName){
        var fs=require('fs')
        var story = JSON.parse(fs.readFileSync('story/'+storyName+'.json'))
        // var story = JSON.parse(fs.readFileSync('story/basic.json'))

        var scene=new THREE.Scene();
        var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight,0.1, 2000 );
        camera.position.set(3,20,-20)
        camera.rotateY(-Math.PI)
        camera.rotateX(-2*Math.PI/8)
        scene.add( camera );
        // environment light
        var ambientLight = new THREE.AmbientLight( 0xcccccc, 1);
        scene.add( ambientLight );
        // ------------------------------------
        // add ground by map
        var terrain=new Territory(story.map)
        scene.add(terrain)

        // add character from document
        var peoples=new THREE.Group();
        scene.add(peoples)
        story.cha.forEach(function(doll){
            var cha=new Character(doll.name,doll.position,doll.carr,doll.camp)
            cha.showMarks()
            peoples.add(cha)
            scene.add(cha.markSpace)
        })

        // add objects from document
        var things=new THREE.Group();
        scene.add(things)
        story.obj.forEach(function(toy){
            var obj=new Accessory(toy.name,toy.position,toy.type)
            things.add(obj)
        })
        // -----------------------------------
        scene.whoIsThere=function(position){
            var man
            peoples.children.forEach(function(object){
                // console.log(object)
                if(object.position.equals(position)){
                    man=object
                }
            })
            return man
        }
        scene.whaIsThere=function(position){
            var obj
            things.children.forEach(function(object){
                if(object.position.equals(position)){
                    obj=object
                }
            })
            return obj
        }
        scene.howIsThere=function(position){
            var tile
            terrain.bricks.children.forEach(function(object){
                if(object.position.equals(position)){
                    tile=object
                }
            })
            return tile
        }
        // do the operator
        scene.execute=function(operators){
            operators.forEach(function(oper){
                peoples.children.forEach(function(man){
                    if(man.position.equals(oper.position)){
                        man.health-=oper.damage
                        man.todo('beaten',1)
                    }
                })
            })
        }

        // make token for each palyer ----------------------------
        var attend=story.attend
        attend.forEach(function(player){
            // peoples.children.forEach(function(man){
            //     if(man.camp==player.camp)
            //     player.control=man
            // })
            new MTLLoader()
                .setPath( './marks/' )
                .load( 'token-R.mtl', function ( materials ) {
                    materials.preload();
                    new OBJLoader()
                        .setMaterials( materials )
                        .setPath( './marks/' )
                        .load( 'token-'+player.camp+'.obj', function ( object ) {
                            // object.position.copy(player.control.position)
                            object.scale.set(.25,.25,.25)
                            scene.add(object);
                            player.token=object
                        });
                });
        })
        // ------------------------------
        scene.round=1
        scene.trend=0
        scene.getInput=function(num,comm,focusMan){ // num = player nymber
            // check the trend is on you
            if(num!=scene.trend){
                return "the trend is not on you"
            }
            // begining of one trend no one in control
            if(attend[scene.trend].control==undefined){

                if(focusMan==undefined){
                    return "don't know who you want to control"
                }

                if(focusMan.camp!=attend[scene.trend].camp){
                    return "you can't control this character"
                }

                if(focusMan.stamina==0){
                    return "the character is tired"
                }

                attend[scene.trend].control=focusMan
                attend[scene.trend].control.markSpace.add(attend[scene.trend].token)
            }

            if(attend[scene.trend].control.running){
                return "character is still running"
            }

            // do commend release and run operator 
            var operators=attend[scene.trend].control.doSingleCommand(comm)
            // attend[trend].token.position.copy(attend[trend].control.position)
            if(operators){scene.execute(operators)}
            
            // present player finish 
            if(attend[scene.trend].control.stamina<=0){
                attend[scene.trend].control=undefined
                // attend[scene.trend].token.visible=false
                scene.add(attend[scene.trend].token)
                scene.trend+=1
                if(scene.trend>=attend.length){scene.trend=0;scene.round+=1}
            }

            // collecting compaign information
            var states=''
            peoples.children.forEach(function(man){
                states+=man.getStates()
            })

            // check all people is tired 
            var endround=true

            scene.peoples.children.forEach(function(man){
                if(man.stamina>0){endround=false}
            })
            if(endround){
                scene.round+=1
                scene.peoples.children.forEach(function(man){
                    man.stamina=man.maxStamina
                    man.showMarks()
                })
            }

            return states
        }
        // ------------------------------

        scene.camera = camera
        scene.peoples= peoples
        scene.things = things
        scene.terrain= terrain
        scene.attend = attend
        return scene
    }
	return Compaign;
})();
export { Compaign };