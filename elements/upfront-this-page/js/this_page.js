(function ($) {
define(function() {

var l10n = Upfront.Settings.l10n.this_page_element;
/**
 * Define the model - initialize properties to their default values.
 * @type {Upfront.Models.ObjectModel}
 */
var ThisPageModel = Upfront.Models.ObjectModel.extend({
	/**
	 * The init function is called after the contructor and Model intialize.
	 * Here the default values for the model properties are set.
	 */
	init: function () {
		var properties = _.clone(Upfront.data.thisPage.defaults);
		properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + '-object');
		this.init_properties(properties);
	}
});

var ThisPageView = (function(){
	// static variables
	var page_id = false,
		changed = false,
		requesting = false,
		saving = false,
		instances = [],
		markups = {},
		queues = {};

	return Upfront.Views.ObjectView.extend({
		markup: false,
		loading: false,
		display: 'title',
		deferred: false,
		is_new: false,
		is_started: false,

		initialize: function(options){
			var me = this;
			if(! (this.model instanceof ThisPageModel)){
				this.model = new ThisPageModel({properties: this.model.get('properties')});
			}
			this.constructor.__super__.initialize.call(this, [options]);
			this.display = this.model.get_property_value_by_name('display');
			instances.push(this);
			page_id = _upfront_post_data.post_id ? _upfront_post_data.post_id : Upfront.Settings.LayoutEditor.newpostType ? 0 : false;

			this.listenTo(Upfront.Events, "command:layout:save_start", this.on_save);
		},

		/**
		 * Element contents markup.
		 * @return {string} Markup to be shown.
		 */
		get_content_markup: function () {
			if(changed || !this.markup){
				this.get_markup().done($.proxy(this.refresh_markup, this));
				return 'Loading';
			}

			return this.markup;
		},

		on_render: function () {
			this.update_editor(this.$el.find(".upfront-object-content"));
		},

		on_edit: function () {
			this.update_editor(this.$el.find(".upfront-object-content"), true, true);
		},

		get_markup: function () {
			var me = this;
			me.deferred = new $.Deferred();

			if ( page_id === false )
				return me.deferred.resolve('error');

			if(requesting)
				return me.deferred.promise();

			if(!changed && markups.length > 0 && markups[me.display]){
				return me.deferred.resolve(markups[me.display]);
			}


			var node = me.$el.find(".upfront-object-content"),
				loading = !node.length ? false : new Upfront.Views.Editor.Loading({
					loading: l10n.refreshing,
					done: l10n.here_we_are,
					fixed: false
				})
			;

			if(loading){
				loading.render();
				node.append(loading.$el);
			}

			requesting = true;

			Upfront.Util.post({
				action: "this_page-get_markup",
				data: JSON.stringify({
					post_id: page_id,
					post_type: Upfront.Settings.LayoutEditor.newpostType
				})
			}).success(function(response){
				if(loading){
					loading.done();
					loading = false;
				}
				var node = node || me.$el.find(".upfront-object-content");
				var page = Upfront.data.posts[page_id];
				markups = response.data.filtered;
				// resolving all instances
				_.each(instances, function(ins){
					ins.is_new = page && page.is_new;
					ins.deferred.resolve(markups[ins.display]);
				});
				if (page)
					page.is_new = false;
			}).done(function(){
				requesting = false;
			});

			return me.deferred.promise();
		},

		get_page: function () {
			var page,
				_deferred = new $.Deferred();
			if ( Upfront.data.posts[page_id] ){
				page = Upfront.data.posts[page_id];
				return _deferred.resolve(page);
			}
			else {
				page = new Upfront.Models.Post({ID: page_id});
				page.fetch({withMeta: true, filterContent: true}).done(function(response){
					if(!Upfront.data.posts)
						Upfront.data.posts = {};
					Upfront.data.posts[page_id] = page;
					_deferred.resolve(page);
				});
			}
			return _deferred.promise();
		},


		refresh_markup: function (markup) {
			var me= this,
				node = this.$el.find(".upfront-object-content"),
				selector = _.findWhere(Upfront.data.ueditor.selectors, {type: this.display}).selector,
				content = '';
			this.get_page().done(function(page){
				node.html(markup);
				if ( me.display == 'title' )
					content = page.get('post_title');
				else if ( me.display == 'content' )
					content = page.get('post_content');
				node.find(selector).html(content);
				me.markup = node.html();
				me.update_editor(node);
			});
		},

		update_editor: function (node, start, focus) {
			focus = typeof focus == 'undefined' ? true : focus;
			var me = this,
				selector = _.findWhere(Upfront.data.ueditor.selectors, {type: this.display}).selector,
				element = node.find(selector),
				ueditor = element.data('ueditor'),
				params = {},
				edit_started = false;
			if ( ueditor ){
				if ( start === true && !me.is_started )
					element.trigger('dblclick');
				return;
			}
			if ( me.display == 'title' ){
				params = {
					airButtons: {},
					observeLinks: false,
					tabFocus: false,
					disableLineBreak: true,
					pastePlainText: true,
					autostart: start === true,
					placeholder: l10n.title_placeholder,
					focus: focus
				};
			}
			else if ( me.display == 'content' ) {
				params = {
					linebreaks: false,
					autostart: start === true,
					placeholder: l10n.content_placeholder,
					focus: focus,
					upfrontMedia: true,
					upfrontImages: true
				};
			}
			element
				.on('start', function(){
					edit_started = true;
					me.is_started = true;
					_.each(instances, function(ins){
						if ( ins == me )
							return;
						ins.update_editor(ins.$el.find(".upfront-object-content"), true, false);
					});
					setTimeout(function(){element.ueditor('focus');}, 100);
					Upfront.Events.trigger('upfront:element:edit:start', 'text');
				})
				.on('stop', function(){
					edit_started = false;
					me.is_started = false;
					Upfront.Events.trigger('upfront:element:edit:stop');
				})
				.on('syncAfter', function(){
					if ( edit_started ){
						queues[me.display] = element.ueditor('get');
						me.markup = $(me.markup).html(queues[me.display]).get(0).outerHTML;
					}
				})
				.ueditor(params)
			;
		},

		on_save: function () {
			if ( saving )
				return;
			saving = true;
			var me = this;
			this.get_page().done(function(page){
				page.set('post_status', 'publish');
				page.set('post_title', queues['title']);
				page.set('post_content', queues['content']);
				page.save().done(function(){
					if ( !me.is_new )
						return;
					var path = '/edit/page/' + page_id;
					//Upfront.Application.load_layout(path);
					Upfront.Application.navigate(path);
					saving = false;
				});
			});
		},

		cleanup: function(){
			var me = this;
			_.each(instances, function(ins, index){
				if ( ins == me )
					instances.splice(index);
			});
		}

	});
})();

/**
 * Editor command class - this will be injected into commands
 * and allow adding the new entity instance to the work area.
 * @type {Upfront.Views.Editor.Command}
 */
var ThisPageTitleElement = Upfront.Views.Editor.Sidebar.Element.extend({

	draggable: false,

	/**
	 * Set up command appearance.
	 */
	render: function () {
		this.$el.html(l10n.page_title);
	},

	/**
	 * What happens when user clicks the command?
	 * We're instantiating a module with search entity (object), and add it to the workspace.
	 */
	add_element: function () {
		var object = new ThisPageModel({ view: 'ThisPageTitle' }), // Instantiate the model
			// Since search entity is an object,
			// we don't need a specific module instance -
			// we're wrapping the search entity in
			// an anonymous general-purpose module
			module = new Upfront.Models.Module({
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c6 upfront-this_page_title_module"},
					{"name": "has_settings", "value": 0}
				],
				"objects": [
					object // The anonymous module will contain our search object model
				]
			})
		;
		// We instantiated the module, add it to the workspace
		this.add_module(module);
	}
});

var ThisPageContentElement = Upfront.Views.Editor.Sidebar.Element.extend({

	draggable: false,

	/**
	 * Set up command appearance.
	 */
	render: function () {
		this.$el.html(l10n.page_content);
	},

	/**
	 * What happens when user clicks the command?
	 * We're instantiating a module with search entity (object), and add it to the workspace.
	 */
	add_element: function () {
		var object = new ThisPageModel({ view: 'ThisPageContent' }), // Instantiate the model
			// Since search entity is an object,
			// we don't need a specific module instance -
			// we're wrapping the search entity in
			// an anonymous general-purpose module
			module = new Upfront.Models.Module({
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c6 upfront-this_page_content_module"},
					{"name": "has_settings", "value": 0}
				],
				"objects": [
					object // The anonymous module will contain our search object model
				]
			})
		;
		// We instantiated the module, add it to the workspace
		this.add_module(module);
	}
});

// ----- Bringing everything together -----
// The definitions part is over.
// Now, to tie it all up and expose to the Subapplication.
/*Upfront.Application.LayoutEditor.add_object("ThisPageTitle", {
	Model: ThisPageModel,
	View: ThisPageTitleView,
	Element: ThisPageTitleElement,
});*/
/*Upfront.Application.LayoutEditor.add_object("ThisPageTitle", {
	Model: ThisPageModel,
	View: ThisPageContentView,
	Element: ThisPageContentElement,
});*/
Upfront.Models.ThisPageModel = ThisPageModel;
Upfront.Views.ThisPageView = ThisPageView;


});
})(jQuery);
