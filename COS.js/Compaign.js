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
        scene.underControl=undefined
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
        // test something here
        scene.probe=function(position){
            var haveMan=scene.whoIsThere(position)
            if(haveMan==scene.underControl){haveMan=undefined}
            var haveObj=scene.whaIsThere(position)
            return haveMan!=undefined||haveObj!=undefined
        }

        // get present states ------------------------
        scene.getChaStates=function(){
            var states=''
            peoples.children.forEach(function(man){
                states+=man.getStates()
            })
            return states
        }
        scene.getObjStates=function(){}

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

        attend.forEach(function(player){
            player.chars=[]
            peoples.children.forEach(function(char){
                if(char.camp==player.camp){
                    player.chars.push(char)
                }
            })
            console.log(player.chars)
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
        // ------------
        new MTLLoader()
				.setPath( './goods/' )
				.load( 'arrow.mtl', function ( materials ) {
					materials.preload();
					new OBJLoader()
						.setMaterials( materials )
						.setPath( './goods/' )
						.load( 'arrow.obj', function ( object ) {
							// object.rotateX(Math.PI/2)
							// object.visible=false
                            // trunk.effects[name]=object
                            object.position.set(1,1,1)
                            object.scale.set(1./16,1./16,1./16)
							scene.add(object);
						});

				});

        // ------------------------------
        scene.round=1
        scene.trend=0
        scene.getSingleInput=function(num,key,focusMan){ // num = player nymber
            // check the trend is on you
            scene.error=''
            if(num!=scene.trend){
                scene.error="the trend is not on you"
                return
            }
            // begining of one trend no one in control
            if(scene.underControl==undefined){

                if(focusMan==undefined){
                    scene.error="don't know who you want to control"
                    return
                }

                if(focusMan.camp!=attend[scene.trend].camp){
                    scene.error="you can't control this character"
                    return
                }

                if(focusMan.stamina==0){
                    scene.error="the character is tired"
                    return
                }
                console.log(focusMan)
                scene.underControl=focusMan
                scene.underControl.markSpace.add(attend[scene.trend].token)
                attend[scene.trend].token.visible=true
            }
            // get where character want to go 
            console.log(scene.underControl)
            var goal=scene.underControl.goal(key)
            if(key=='Tab'){
                scene.underControl.stamina=0
                scene.underControl.showMarks()
                goal=1
                
                // return 'wants to stop move'
            }

            // animation playing
            if(scene.underControl.running){
                scene.error="character is still running"
                return
            }

            // check commend include 
            if(!goal){
                scene.error="command Unrecognizable"
                return
            }
            
            // check stamina enough to do order 
            if(!scene.underControl.enoughTo(key)){
                scene.error="character stamina not enough do this command"
                return
            }

            scene.underControl.record=key+scene.underControl.record
            // do commend release and run operator
            if(scene.probe(goal)){
                // can't go forward 
                scene.underControl.todo('beaten',1)
                scene.underControl.stamina-=1
            }else{
                var operators=scene.underControl.doSingleOrder(key)
                if(operators){scene.execute(operators)}
            }

            // collecting compaign information
            var states=''
            peoples.children.forEach(function(man){
                states+=man.getStates()
            })

            // present player finish 
            var endround=true
            if(scene.underControl.stamina<=0){
                scene.underControl.record=''
                scene.underControl=undefined
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