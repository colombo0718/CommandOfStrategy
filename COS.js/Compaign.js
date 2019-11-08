import * as THREE from './three.js/three.module.js';
import { Character } from './Character.js';
import { Accessory } from './Accessory.js';
import { EmptyMap,BuildField } from './BattleField.js';

var Compaign=( function(){
    function Compaign(storyName){
        var scene=new THREE.Scene();
        scene.peoples=[]
        scene.things=[]
        var fs=require('fs')

        var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight,0.1, 2000 );
        camera.position.set(10,20,-20)
        camera.rotateY(-Math.PI)
        camera.rotateX(-2*Math.PI/8)
        scene.camera=camera
        scene.add( camera );

        var ambientLight = new THREE.AmbientLight( 0xcccccc, 1);
        scene.add( ambientLight );


        var story = JSON.parse(fs.readFileSync('story/'+storyName+'.json'))
        var story = JSON.parse(fs.readFileSync('story/train.json'))
        var field=new BuildField(story.map)
        scene.add(field)

        // add character from document
        story.cha.forEach(function(doll){
            var cha=new Character(doll.name,doll.position,doll.carr,doll.camp)
            cha.showMarks()
            scene.peoples.push(cha)
            scene.add(cha)
            scene.add(cha.markSpace)
        })

        // add objects from document
        story.obj.forEach(function(toy){
            var obj=new Accessory(toy.name,toy.position,toy.type)
            scene.things.push(obj)
            scene.add(obj)
        }) 

        return scene
    }
	return Compaign;
})();
export { Compaign };