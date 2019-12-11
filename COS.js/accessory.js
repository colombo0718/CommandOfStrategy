import * as THREE from './three.js/three.module.js';
import { MTLLoader } from './three.js/MTLLoader.js';
import { OBJLoader } from './three.js/OBJLoader.js';

var Accessory=( function(){
	// console.log(Group)
	function Accessory(name,position){
				
        var thing=new THREE.Group(); 
        thing.name=name
        thing.scale.set(.25,.25,.25)
        thing.position.copy(position)
        
        new MTLLoader()
        .setPath( './goods/' )
        .load( name+'.mtl', function ( materials ) {
            // materials.preload();
            new OBJLoader()
                .setMaterials( materials )
                .setPath( './goods/' )
                .load( name+'.obj', function ( object ) {
                    thing.rotateY( Math.PI/2*position.d)
                    thing.add(object)
                });

        } );
        if(name=="torch"){
            var pointLight = new THREE.PointLight( 0xffffff, .3);
            pointLight.position.set(0,1.5,0)
            thing.add( pointLight );
        }

        new OBJLoader()
			.setPath( './goods/' )
			.load('objeSele.obj', function ( selector ) {
				selector.children[0].material.color.set(0xff0000)
				selector.visible=false
				thing.add(selector);
				thing.selector=selector
			});
        thing.showSeletor=function(color){
			this.selector.visible=true
			this.selector.children[0].material.color.set(color)
		}  
		thing.hideSeletor=function(color){
			this.selector.visible=false
		}

		return thing
	}

	return Accessory;
})();

export { Accessory };