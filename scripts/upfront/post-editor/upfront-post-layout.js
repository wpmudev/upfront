;(function($){define([], function(){


var ImageVariants = new Upfront.Collections.ImageVariants( Upfront.mainData.postImageVariants );
var PrevImageVariants = new Upfront.Collections.ImageVariants( Upfront.mainData.prevPostImageVariants );
var OtherImageVariants = new Upfront.Collections.ImageVariants( Upfront.mainData.otherPostImageVariants );

//Set Upfront.Content
if(!Upfront.Content)
	Upfront.Content = {};

_.extend(Upfront.Content, {
    ImageVariants : ImageVariants,
	PrevImageVariants: PrevImageVariants,
	OtherImageVariants: OtherImageVariants
});

return {};

//End define
});})(jQuery);
