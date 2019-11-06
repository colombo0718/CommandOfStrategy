import * as THREE from './three.js/three.module.js';
import { MTLLoader } from './three.js/MTLLoader.js';
import { OBJLoader } from './three.js/OBJLoader.js';

var EmptyMap=( function(){
	function EmptyMap(x,y){
        var map=[]
        for(var i=0;i<x;i++){
            var col=new Array(y)
            col.fill(1)
            map.push(col.slice(0))
        }
		return map
	}
	return EmptyMap;
})();

var BuildField=( function(){
	function BuildField(map){
        var addTile = function(i,j,type,Field){
            var name=''
            if(type==1){name='soil'}
            if(type==2){name='water'}
            new MTLLoader()
            .setPath( './tiles/' )
            .load( name+'.mtl', function ( materials ) {
                console.log(name)
                // materials.preload();
                new OBJLoader()
                    .setMaterials( materials )
                    .setPath( './tiles/' )
                    .load( name+'.obj', function ( object ) {
                        // console.log(object.children[0].position)
                        object.children[0].scale.set(.25,.25,.25)
                        object.children[0].position.x=i
                        object.children[0].position.z=j
                        object.children[0].name=''+i+j
                        // console.log(object.children[0])
                        Field.add( object.children[0] );
                    });

            } ); 
        }

        var Field = new THREE.Group()

        // for(var j=0;j<map[0].length;j++){
        //     for(var i=0;i<map.length;i++){
        for(var j=0;j<map.length;j++){
            for(var i=0;i<map[0].length;i++){
                // addTile(i,j,map[i][j],Field)
                addTile(i,j,map[j][i],Field)
            }
        }
		return Field
	}

	return BuildField;
})();

export { EmptyMap,BuildField };