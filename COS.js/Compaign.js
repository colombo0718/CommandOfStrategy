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
        var story = JSON.parse(fs.readFileSync('story/basic.json'))

        var scene=new THREE.Scene();
        var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight,0.1, 2000 );
        camera.position.set(3,20,-20)
        camera.rotateY(-Math.PI)
        camera.rotateX(-2*Math.PI/8)
        scene.add( camera );
        // environment light
        var ambientLight = new THREE.AmbientLight( 0xcccccc, 1);
        scene.add( ambientLight );
        var underControl
        // ------------------------------------
        // add ground by map
        var terrain=new Territory(story.map)
        scene.add(terrain)

        // add character from document
        var peoples=new THREE.Group();
        scene.add(peoples)
        story.cha.forEach(function(doll){
            var cha=new Character(doll.name,doll.position,doll.carr,doll.camp)
            // add type data to character
            cha.type="decorate"
            story.attend.forEach(function(player){
                if(player.camp==cha.camp){cha.type=player.type}
            })
            peoples.add(cha)
            if(cha.type!="decorate"){
                cha.showMarks()
                scene.add(cha.markSpace)
            }
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
        scene.probe=function(position){
            var haveMan=scene.whoIsThere(position)
            if(haveMan==underControl){haveMan=undefined}
            var haveObj=scene.whaIsThere(position)
            return haveMan!=undefined||haveObj!=undefined
        }
        // do the operator -------------------------
        scene.execute=function(operators){
            operators.forEach(function(oper){
                peoples.children.forEach(function(man){
                    if(man.position.equals(oper.aim)&& man.type!="decorate"){
                        man.influ(oper.effect)
                        man.todo('beaten',1)
                    }
                })
            })
        }

        // make token for each palyer ----------------------------
        var attend=story.attend
        attend.forEach(function(player){
            new MTLLoader()
                .setPath( './marks/' )
                .load( 'token-R.mtl', function ( materials ) {
                    materials.preload();
                    new OBJLoader()
                        .setMaterials( materials )
                        .setPath( './marks/' )
                        .load( 'token-'+player.camp+'.obj', function ( object ) {
                            object.visible=false
                            object.scale.set(.25,.25,.25)
                            scene.add(object);
                            player.token=object
                        });
                });
        })

        scene.countRemain=function(){
            scene.attend.forEach(function(player){
                player.vigor=0
                player.alive=0
                scene.peoples.children.forEach(function(man){
                    if(player.camp==man.camp){
                        if(man.stamina>0 && man.health>0){player.vigor+=1}
                        if(man.health>0) {player.alive+=1}
                    }
                })
            })
        }

        // ------------------------------
        scene.round=1
        scene.trend=0
        scene.getInput=function(num,key,focusMan){ // num = player nymber
            // check the trend is on you
            if(num!=scene.trend){
                return "the trend is not on you"
            }
            // begining of one trend no one in control
            if(underControl==undefined){

                if(focusMan==undefined){
                    return "don't know who you want to control"
                }

                if(focusMan.camp!=attend[scene.trend].camp){
                    return "you can't control this character"
                }

                if(focusMan.stamina==0){
                    return "the character is tired"
                }

                underControl=focusMan
                underControl.markSpace.add(attend[scene.trend].token)
                attend[scene.trend].token.visible=true
            }
            //
            var goal=underControl.goal(key)
            if(key=='Escape'){
                underControl.stamina=0
                underControl.showMarks()
                goal=1
                
                // return 'wants to stop move'
            }

            // animation playing
            if(underControl.running){
                return "character is still running"
            }

            // check commend include 
            if(!goal){
                return "command Unrecognizable"
            }
            
            // check stamina enough to do order 
            if(!underControl.enoughTo(key)){
                return "character stamina not enough do this command"
            }

            underControl.record=key+underControl.record
            // do commend release and run operator
            if(scene.probe(goal)){
                underControl.todo('beaten',1)
                underControl.stamina-=1
            }else{
                var operators=underControl.doSingleOrder(key)
                if(operators){scene.execute(operators)}
            }

            // collecting compaign information
            var states=''
            peoples.children.forEach(function(man){
                states+=man.getStates()
            })

            // present player finish 
            var endround=true
            console.log(underControl.stamina)
            if(underControl.stamina<=0){
                underControl.record=''
                underControl=undefined
                attend[scene.trend].token.visible=false
                scene.add(attend[scene.trend].token)
                // count vigor and alive people remain
                scene.countRemain()
                // if all team vigor zero 
                scene.attend.forEach( function(player){
                    if(player.vigor>0){endround=false}
                })
                if(endround){
                    scene.round+=1
                    scene.peoples.children.forEach(function(man){
                        man.stamina=man.maxStamina
                        man.showMarks()
                    })
                }
                scene.countRemain()
                // to next player
                for(var i=0;i<attend.length;i++){
                    scene.trend+=1
                    if(scene.trend==attend.length){scene.trend=0}
                    if(scene.attend[scene.trend].vigor>0){break;}
                }
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