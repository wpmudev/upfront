;(function ($) {
define([
	"scripts/redactor/ueditor-insert",
	"scripts/redactor/ueditor-image-insert",
	"scripts/redactor/ueditor-image-insert-post",
	"scripts/redactor/ueditor-embed-insert",
	"scripts/redactor/ueditor-post-image-insert-manager"
], function (Insert, ImageInsert, ImageInsertPost, EmbedInsert, PostImageInsertManager) {

var TYPES = {
	IMAGE: 'image',
	POSTIMAGE: 'postImage',
	EMBED : 'embed'
};

var insertObjects = {},
	insertNames = {}
;

insertObjects[TYPES.POSTIMAGE] = PostImageInsertManager.PostImageInsert_Manager;
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
});
})(jQuery);
