import * as THREE from './three.js/three.module.js';
import { Character } from './Character.js';
import { Accessory } from './Accessory.js';
import { Territory } from './Territory.js';
//import{territory}

var Compaign=( function(){
    function Compaign(storyName){
        var fs=require('fs')
        var story = JSON.parse(fs.readFileSync('story/'+storyName+'.json'))
        // var story = JSON.parse(fs.readFileSync('story/train.json'))

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
        // ---------------------------------
        scene.camera =camera
        scene.peoples=peoples
        scene.things =things
        scene.terrain=terrain
        return scene
    }
	return Compaign;
})();
export { Compaign };