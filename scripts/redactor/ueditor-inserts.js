;(function($){
define(["scripts/redactor/ueditor-insert", "scripts/redactor/ueditor-image-insert", "scripts/redactor/ueditor-embed-insert"], function(Insert,ImageInsert, EmbedInsert){

var TYPES = {
	IMAGE: 'image',
    POSTIMAGE: 'postImage',
    EMBED : 'embed'
};

var insertObjects = {};
var insertNames = {};
insertObjects[TYPES.POSTIMAGE] = ImageInsert.PostImageInsert;
insertObjects[TYPES.IMAGE] = ImageInsert.ImageInsert;
insertObjects[TYPES.EMBED] = EmbedInsert.EmbedInsert;

insertNames[TYPES.POSTIMAGE] = "Image";
insertNames[TYPES.IMAGE] = "Image";
insertNames[TYPES.EMBED] = "Embed";

return {
	UeditorInsert: Insert.UeditorInsert,
	inserts: insertObjects,
	TYPES: TYPES,
	NAMES: insertNames
};

//End Define
});})(jQuery);
