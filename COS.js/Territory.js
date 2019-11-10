import * as THREE from './three.js/three.module.js';
import { MTLLoader } from './three.js/MTLLoader.js';
import { OBJLoader } from './three.js/OBJLoader.js';

var Territory=( function(){
	function Territory(map){
        // var tile
        var addTile=function(i,j,type,terrain){
            var tile
            var name=''
            if(type==1){name='soil'}
            if(type==2){name='water'}
            new MTLLoader()
                .setPath( './tiles/' )
                .load( name+'.mtl', function ( materials ) {
                    new OBJLoader()
                        .setMaterials( materials )
                        .setPath( './tiles/' )
                        .load( name+'.obj', function ( object ) {
                            object.children[0].scale.set(.25,.25,.25)
                            object.children[0].position.x=i
                            object.children[0].position.z=j
                            object.children[0].name=''+i+j
                            // object.children[0].visible=false
                            tile=object.children[0]
                            terrain.add(tile)
                            
                            new OBJLoader()
                            	.setPath( './goods/' )
                            	.load('posiSele.obj', function ( selector ) {
                                    selector.children[0].material.color.set(0xff0000)
                                    tile.add(selector);
                                    tile.selector=selector
                                });
                                
                                
                            tile.showSeletor=function(color){
                                console.log(this.selector.children[0].material.color.set(color))
                            }


                            terrain.add(tile)
                        });
                } ); 
        }

        var terrain = new THREE.Group()

        for(var j=0;j<map.length;j++){
            for(var i=0;i<map[0].length;i++){
                var a=addTile(i,j,map[j][i],terrain)
            }
        }
        console.log(terrain.children.length)
        terrain.children.forEach(function(tile){
            console.log(tile)
        })
        // new OBJLoader()
		// 	.setPath( './dolls/signs/' )
		// 	.load(trunk.signs[0]+'.obj', function ( object ) {
		// 		object.children[0].material.color.set(campcolor)
		// 		object.rotateX(Math.PI/2)
		// 		trunk.getObjectByName('Bone-30').add(object);
		// 	});
        return terrain		
	}
	return Territory;
})();
export { Territory };