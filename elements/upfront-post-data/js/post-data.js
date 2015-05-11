(function ($) {
define([
	'text!elements/upfront-post-data/tpl/views.html',
	'elements/upfront-post-data/js/post-data-views',
	'elements/upfront-post-data/js/post-data-settings'
], function(tpl, Views, PostDataSettings) {

var l10n = Upfront.Settings.l10n.post_data_element;
var $template = $(tpl);


var PostDataPartModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		var properties = Upfront.data.upfront_post_data_part
			? _.clone(Upfront.data.upfront_post_data_part)
			: {}
		;
		properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + '-object');
		this.init_properties(properties);
	}
});

var PostDataModel = Upfront.Models.ObjectGroup.extend({
	init: function () {
		var data_type = this.get_property_value_by_name('data_type'),
			data_key = data_type ? 'upfront_post_data_' + data_type : 'upfront_post_data',
			properties = Upfront.data[data_key]
			? _.clone(Upfront.data[data_key])
			: {}
		;
		properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + '-object');
		this.init_properties(properties);
	}
});


var PostDataPartView = Upfront.Views.ObjectView.extend({
	init: function () {
		
	},
	
	on_render: function () {
		
	},
	
	render_view: function (markup) {
		console.log('part render view???', this, markup)
		this.$el.find('.upfront-object-content').empty().append(markup);
	}
});

var PostDataView = Upfront.Views.ObjectGroup.extend({
	init: function () {
		this.listenTo(this.model.get('objects'), 'change', this.on_render);
		this.listenTo(this.model.get('objects'), 'add', this.on_render);
		this.listenTo(this.model.get('objects'), 'remove', this.on_render);
	},

	on_render: function () {
		var type = this.model.get_property_value_by_name("data_type");
		this.render_view(type);
	},

	render_view: function (type) {
		type = type || Views.DEFAULT;
		var me = this,
			view = Views[type]
			? new Views[type]({model: this.model})
			: new Views[Views.DEFAULT]({model: this.model})
		;
		view.element = this;
		view.render();
		this.$el.find(".upfront-object-group-default").append(view.$el);
	},

});


var PostDataElement = Upfront.Views.Editor.Sidebar.Element.extend({
	
	_default_data: {
		type: '',
		columns: 24,
		rows: Upfront.Util.height_to_row(200),
		name: ''
	},
	
	_post_parts: [],

	render: function () {
		//this.$el.addClass('upfront-icon-element upfront-icon-element-post-data');
		this.$el.html(this._default_data.name);
	},
	
	create_part_objects: function (types) {
		var me = this,
			objects = [],
			wrappers = [];
		_.each(types, function(type){
			var object = me.create_part_object(type);
			objects.push( object.object );
			wrappers.push( object.wrapper );
		});
		return {
			objects: objects,
			wrappers: wrappers
		};
	},
	
	create_part_object: function (type) {
		var wrapper_id = Upfront.Util.get_unique_id("wrapper"),
			wrapper = new Upfront.Models.Wrapper({
				properties: [
					{ name: 'wrapper_id', value: wrapper_id },
					{ name: 'class', value: 'c24' }
				]
			}),
			object = new PostDataPartModel({
				properties: [
					{ name: 'view_class', value: 'PostDataPartView' },
					{ name: 'part_type', value: type },
					{ name: 'has_settings', value: 0 },
					{ name: 'class', value: 'c24 upfront-post-data-part' },
					{ name: 'wrapper_id', value: wrapper_id }
				]
			});
		return {
			object: object,
			wrapper: wrapper
		};
	},

	add_element: function () {

		var part_objects = this.create_part_objects(this._post_parts),
			object = new PostDataModel({
				properties: [
					{"name": "data_type", "value": this._default_data.type}
				],
				objects: part_objects.objects,
				wrappers: part_objects.wrappers
			}),
			module = new Upfront.Models.Module({
				name: "",
				properties: [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c" + this._default_data.columns + " upfront-post_data_module"},
					{"name": "has_settings", "value": 0},
					{"name": "row", "value": this._default_data.rows}
				],
				objects: [object]
			})
		;
		this.add_module(module);
	}
});

var PostDataElement_PostData = PostDataElement.extend({
	_default_data: {
		type: 'post_data',
		columns: 18,
		rows: Upfront.Util.height_to_row(200),
		name: 'Post Data'
	},
	_post_parts: [
		'date_posted',
		'title',
		'content'
	]
});

var PostDataElement_Author = PostDataElement.extend({
	_default_data: {
		type: 'author',
		columns: 4,
		rows: Upfront.Util.height_to_row(100),
		name: 'Author'
	},
	_post_parts: [
		'author',
		'gravatar'
	]
});

var PostDataElement_Taxonomy = PostDataElement.extend({
	_default_data: {
		type: 'taxonomy',
		columns: 18,
		rows: Upfront.Util.height_to_row(50),
		name: 'Categories & Tags'
	},
	_post_parts: [
		'tags',
		'categories'
	]
});

var PostDataElement_FeaturedImage = PostDataElement.extend({
	_default_data: {
		type: 'featured_image',
		columns: 18,
		rows: Upfront.Util.height_to_row(200),
		name: 'Featured Image'
	},
	_post_parts: [
		'featured_image'
	]
});

var PostDataElement_Comments = PostDataElement.extend({
	_default_data: {
		type: 'comments',
		columns: 18,
		rows: Upfront.Util.height_to_row(200),
		name: 'Comments'
	},
	_post_parts: [
		'comment_count',
		'comments',
		'comment_form'
	]
});

function add_elements () {
	if ( 'type' in _upfront_post_data.layout && 'single' === _upfront_post_data.layout.type ) {
		Upfront.Application.LayoutEditor.add_object("Upostdata-post_data", {
			"Model": PostDataModel,
			"View": PostDataView,
			"DataElement": PostDataElement_PostData,
			"Settings": PostDataSettings,
			cssSelectors: {
			},
			cssSelectorsId: 'PostDataModel'
		});
		
		Upfront.Application.LayoutEditor.add_object("Upostdata-author", {
			"Model": PostDataModel,
			"View": PostDataView,
			"DataElement": PostDataElement_Author,
			"Settings": PostDataSettings,
			cssSelectors: {
			},
			cssSelectorsId: 'PostDataModel'
		});
		
		Upfront.Application.LayoutEditor.add_object("Upostdata-taxonomy", {
			"Model": PostDataModel,
			"View": PostDataView,
			"DataElement": PostDataElement_Taxonomy,
			"Settings": PostDataSettings,
			cssSelectors: {
			},
			cssSelectorsId: 'PostDataModel'
		});
		
		Upfront.Application.LayoutEditor.add_object("Upostdata-featured_image", {
			"Model": PostDataModel,
			"View": PostDataView,
			"DataElement": PostDataElement_FeaturedImage,
			"Settings": PostDataSettings,
			cssSelectors: {
			},
			cssSelectorsId: 'PostDataModel'
		});
		
		Upfront.Application.LayoutEditor.add_object("Upostdata-comments", {
			"Model": PostDataModel,
			"View": PostDataView,
			"DataElement": PostDataElement_Comments,
			"Settings": PostDataSettings,
			cssSelectors: {
			},
			cssSelectorsId: 'PostDataModel'
		});
	}
	else {
		Upfront.Application.LayoutEditor.remove_object('Upostdata-post_data');
		Upfront.Application.LayoutEditor.remove_object('Upostdata-author');
		Upfront.Application.LayoutEditor.remove_object('Upostdata-taxonomy');
		Upfront.Application.LayoutEditor.remove_object('Upostdata-featured_image');
		Upfront.Application.LayoutEditor.remove_object('Upostdata-comments');
	}
}

Upfront.Events.on("application:setup:editor_interface", function () {
	add_elements();
});
add_elements();



Upfront.Models.PostDataModel = PostDataModel;
Upfront.Models.PostDataPartModel = PostDataPartModel;
Upfront.Views.PostDataView = PostDataView;
Upfront.Views.PostDataPartView = PostDataPartView;


});
}(jQuery));
