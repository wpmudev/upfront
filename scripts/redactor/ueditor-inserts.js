;(function($){
define(["scripts/redactor/ueditor-insert", "scripts/redactor/ueditor-image-insert", "scripts/redactor/ueditor-embed-insert"], function(Insert,ImageInsert, EmbedInsert){

var TYPES = {
	IMAGE: 'image',
    IMAGEPRO: 'imagepro',
    EMBED : 'embed'
};

var insertObjects = {};
insertObjects[TYPES.IMAGEPRO] = ImageInsert.ImageProInsert;
insertObjects[TYPES.IMAGE] = ImageInsert.ImageInsert;
insertObjects[TYPES.EMBED] = EmbedInsert.EmbedInsert;

return {
	UeditorInsert: Insert.UeditorInsert,
	inserts: insertObjects,
	TYPES: TYPES
};

//End Define
});})(jQuery);
