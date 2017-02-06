;(function($){
define([
    "scripts/redactor/ueditor-insert",
    "scripts/redactor/ueditor-video-insert",
    "scripts/redactor/ueditor-image-insert",
    "scripts/redactor/ueditor-image-insert-post",
    "scripts/redactor/ueditor-embed-insert",
    "scripts/redactor/ueditor-post-image-insert-manager"
], function(Insert, VideoInsert, ImageInsert, ImageInsertPost, EmbedInsert, PostImageInsertManager){

var TYPES = {
	IMAGE: 'image',
	POSTIMAGE: 'postImage',
	EMBED : 'embed',
	VIDEO: 'video'
};

var insertObjects = {};
var insertNames = {};
insertObjects[TYPES.POSTIMAGE] = PostImageInsertManager.PostImageInsert_Manager;
insertObjects[TYPES.IMAGE] = ImageInsert.ImageInsert;
insertObjects[TYPES.EMBED] = EmbedInsert.EmbedInsert;
insertObjects[TYPES.VIDEO] = VideoInsert.VideoInsert;

insertNames[TYPES.POSTIMAGE] = "Image";
insertNames[TYPES.IMAGE] = "Image";
insertNames[TYPES.EMBED] = "Embed";
insertNames[TYPES.VIDEO] = "Video";

return {
	UeditorInsert: Insert.UeditorInsert,
	inserts: insertObjects,
	TYPES: TYPES,
	NAMES: insertNames
};

//End Define
});})(jQuery);
