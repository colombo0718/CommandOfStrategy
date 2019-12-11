import * as THREE from './three.js/three.module.js';
import { MTLLoader } from './three.js/MTLLoader.js';
import { OBJLoader } from './three.js/OBJLoader.js';

var Territory=( function(){
	function Territory(map){
        var terrain = new THREE.Group()
        var sensors = new THREE.Group()
        var bricks  = new THREE.Group()

        // build sensor boards ------------------------
        var addTile=function(i,j,type,sensors){
            new OBJLoader()
                .setPath( './tiles/' )
                .load( 'sensor_flat.obj', function ( object ) {
                    object.children[0].material.color.set(0xff0000)
                    object.children[0].scale.set(.25,.25,.25)
                    object.children[0].material.transparent=true
			        object.children[0].material.opacity=0
                    object.children[0].position.x=i
                    object.children[0].position.z=j
                    sensors.add(object.children[0])
                });
        }
        for(var j=0;j<map.length;j++){
            for(var i=0;i<map[0].length;i++){
                addTile(i,j,map[j][i],sensors)
            }
        }
        terrain.add(sensors)

        // add ground tiles-------------------------
        var addTile=function(i,j,type,bricks){
            var name=''
            if(type==1){name='soil'}
            if(type==2){name='water'}
            new MTLLoader()
                .setPath( './tiles/' )
                .load( name+'.mtl', function ( materials ) {
                    new OBJLoader()
                        .setMaterials( materials )
                        .setPath( './tiles/' )
                        .load( name+'.obj', function ( tile ) {
                            tile.name=name
                            tile.scale.set(.25,.25,.25)
                            tile.position.x=i
                            tile.position.z=j
                            // add selector and its functions to every ground 
                            new OBJLoader()
                            	.setPath( './goods/' )
                            	.load('posiSele.obj', function ( selector ) {
                                    selector.visible=false
                                    tile.add(selector);
                                    tile.selector=selector
                                });
                            tile.showSeletor=function(color){
                                this.selector.visible=true
                                this.selector.children[0].material.color.set(color)
                            }  
                            tile.hideSeletor=function(color){
                                this.selector.visible=false
                            } 
                            bricks.add(tile)                          
                        });
                } ); 
        }
        for(var j=0;j<map.length;j++){
            for(var i=0;i<map[0].length;i++){
                addTile(i,j,map[j][i],bricks)
            }
        }
        terrain.add(bricks)
        // ------- 
        terrain.bricks = bricks
        terrain.sensors=sensors
        return terrain		
	}
	return Territory;
})();
export { Territory };