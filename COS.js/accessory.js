import * as THREE from './three.js/three.module.js';
import { MTLLoader } from './three.js/MTLLoader.js';
import { OBJLoader } from './three.js/OBJLoader.js';

var Accessory=( function(){
	// console.log(Group)
	function Accessory(name,position,type){
				
        var thing=new THREE.Group(); 
        thing.name=name
        thing.scale.set(.25,.25,.25)
        thing.position.copy(position)
        
        new MTLLoader()
        .setPath( './goods/' )
        .load( type+'.mtl', function ( materials ) {
            // materials.preload();
            new OBJLoader()
                .setMaterials( materials )
                .setPath( './goods/' )
                .load( type+'.obj', function ( object ) {
                    thing.rotateY( Math.PI/2*position.d)
                    // thing.rotateY( Math.PI/2)
                    thing.add(object)
                });

        } );
        if(type=="torch"){
            var pointLight = new THREE.PointLight( 0xffffff, .3);
            pointLight.position.set(0,1.5,0)
            thing.add( pointLight );
        }

		return thing
	}

	return Accessory;
})();

export { Accessory };