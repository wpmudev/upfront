(function($){
		var l10n = Upfront.Settings && Upfront.Settings.l10n
						? Upfront.Settings.l10n.global.views
						: Upfront.mainData.l10n.global.views
				;
		define([
				"text!upfront/templates/popup.html",
				'scripts/perfect-scrollbar/perfect-scrollbar'
		], function ( popup_tpl, perfectScrollbar ) {

				return Backbone.View.extend({
						events: {
								"click #upfront-list-meta .upfront-list_item-component": "handle_sort_request",
								"click .upfront-list-page_item": "handle_page_activate",
								"click .upfront-page-path-item": "handle_page_activate",
								"change #upfront-page_template-select": "template_change",
								"click .editaction.edit": "handle_post_edit",
								"click .editaction.trash": "trash_confirm",
								"click .upfront-posts-delete-cancel-button": "trash_cancel",
								"click .upfront-posts-delete-button": "trash_page"
						},
						currentPage: false,
						pageListTpl: _.template($(popup_tpl).find('#upfront-page-list-tpl').html()),
						pageListItemTpl: _.template($(popup_tpl).find('#upfront-page-list-item-tpl').html()),
						pagePreviewTpl: _.template($(popup_tpl).find('#upfront-page-preview-tpl').html()),
						allTemplates: [],
						initialize: function(options){
								this.collection.on('change reset', this.render, this);
								this.listenTo(Upfront.Events, 'post:saved', this.post_saved);
						},
						render: function () {
								var pages = this.collection.getPage(this.collection.pagination.currentPage);//this.collection.where({'post_parent': 0});
								// Render
								this.$el.html(
										this.pageListTpl({
												pages: pages,
												pageItemTemplate: this.pageListItemTpl,
												orderby: this.collection.orderby,
												order: this.collection.order,
												canEdit: Upfront.Application.user_can("EDIT"),
												canEditOwn: Upfront.Application.user_can("EDIT_OWN")
										})
								);
	
								// Add JS Scrollbar.
								perfectScrollbar.withDebounceUpdate(
									// Element.
									this.$el.find('.upfront-scroll-panel')[0],
									// Run First.
									true,
									// Event.
									false,
									// Initialize.
									true
								);

								// Add tooltips to inline edit/trash buttons.
								this.add_tooltips();
						},

						// Add tooltips to inline edit/trash buttons.
						add_tooltips: function() {
								// Add Edit tooltip.
								this.$el.find('.editaction.edit').utooltip({
									fromTitle: false,
									content: Upfront.Settings.l10n.global.content.edit_page,
									panel: 'postEditor'
								});

								// Add trash tooltip.
								this.$el.find('.editaction.trash').utooltip({
									fromTitle: false,
									content: Upfront.Settings.l10n.global.content.trash_page,
									panel: 'postEditor'
								});
						},

						renderPreview: function (page) {
								var $root = this.$el.find("#upfront-list-page-preview");

								$root.html(this.pagePreviewTpl({
										page: page,
										template: page.template ? page.template : 'Default',
										allTemplates: this.allTemplates ? this.allTemplates : []
								}));
								this.$el.find("#upfront-page_preview-edit button").one("click", function () {
										//window.location = Upfront.Settings.Content.edit.page + page.get('ID');
										var path = '/edit/page/' + page.get('ID');
										// Respect dev=true
										if (window.location.search.indexOf('dev=true') > -1) path += '?dev=true';
										Upfront.Popup.close();
										if(_upfront_post_data) _upfront_post_data.post_id = page.get('ID');
										Upfront.Application.navigate(path, {trigger: true});
								});
						},
						handle_sort_request: function (e) {
								var $option = $(e.target).closest('.upfront-list_item-component'),
										sortby = $option.attr('data-sortby'),
										order = this.collection.order;
								if(sortby){
										if(sortby == this.collection.orderby)
												order = order == 'desc' ? 'asc' : 'desc';
										this.collection.reSort(sortby, order);
								}
						},
						handle_post_edit: function (e) {
								e.preventDefault();
								var postId = $(e.currentTarget).closest('.upfront-list_item-post').attr('data-post_id');
								if(_upfront_post_data) _upfront_post_data.post_id = postId;
								if (postId === 'home') {
									Upfront.Application.navigate('?editmode=true', {trigger: true});
								} else {
									Upfront.Application.navigate('/edit/page/' + postId, {trigger: true});
								}
								Upfront.Events.trigger('click:edit:navigate', postId);
						},
						handle_post_view: function (e) {
								e.preventDefault();
								var postId = $(e.currentTarget).closest('.upfront-list_item-post').attr('data-post_id');
								window.location.href = this.collection.get(postId).get('permalink');
						},
						handle_page_activate: function (e) {
								var page = this.collection.get($(e.target).attr("data-post_id"));
								e.preventDefault();
								e.stopPropagation();

								this.$(".upfront-list-page_item").removeClass("active");
								this.$("#upfront-list-page_item-" + page.id).addClass("active").toggleClass('closed');

								this.update_path(page);
								this.update_page_preview(page);

								this.currentPage = page;
						},
						trash_confirm: function(e) {
							// Show delete confirmation.
							$(e.target).parents('.upfront-list_item').find('.upfront-delete-confirm').show();
						},
						trash_cancel: function(e) {
							// Hide delete confirmation.
							$(e.target).parents('.upfront-delete-confirm').hide();
						},
						trash_page: function (e) {
								var me = this;
								var postelement = $(e.currentTarget).closest('.upfront-list_item-post.upfront-list_item');
								var postId = postelement.attr('data-post_id');
								// Hide delete confirmation.
								$(e.target).parents('.upfront-delete-confirm').hide();
								// Delete Page.
								this.collection.get(postId).set('post_status', 'trash').save().done(function(){

										me.collection.remove(me.collection.get(postId));
										postelement.remove();
								});
						},
						post_saved: function () {
								// We should fetch colletion after post / page update to retrieve any title changes
								this.collection.fetch();
						},
						update_path: function (page) {
								var current = page,
										fragments = [{id: page.get('ID'), title: page.get('post_title')}],
										$root = this.$el.find("#upfront-list-page-path"),
										output = ''
										;

								while(current.get('post_parent')){
										current = this.collection.get(current.get('post_parent'));
										fragments.unshift({id: current.get('ID'), title: current.get('post_title')});
								}

								_.each(fragments, function(p){
										if(output)
												output += '&nbsp;Â»&nbsp;';
										if(p.id == page.id)
												output += '<span class="upfront-page-path-current last">' + p.title + '</span>';
										else
												output += '<a href="#" class="upfront-page-path-item" data-post_id="' + p.id + '">' + p.title + '</a>';
								});
								$root.html(output);
						},

						update_page_preview: function (page) {
								var me = this,
										getExtra = !page.thumbnail || !me.allTemplates || !page.template,
										extra = getExtra ?
										{
												thumbnail: !page.thumbnail,
												thumbnailSize: 'medium',
												allTemplates: !me.allTemplates,
												template: !page.template,
												action: 'get_post_extra',
												postId: page.get('ID')
										} : {}
										;

								if(getExtra){
										this.collection.post(extra)
												.done(function(response){
														if(response.data.thumbnail && response.data.postId == page.get('ID')){
																me.$('#upfront-page_preview-featured_image img').attr('src', response.data.thumbnail[0]).show();
																me.$('.upfront-thumbnailinfo').hide();
																page.thumbnail = response.data.thumbnail[0];
														}
														else{
																me.$('.upfront-thumbnailinfo').text(l10n.no_image);
																me.$('.upfront-page_preview-edit_feature a').html('<i class="icon-plus"></i> ' + l10n.add);
														}

														if(response.data.allTemplates)
																me.allTemplates = response.data.allTemplates;
														if(response.data.template){
																page.template = response.data.template;
																me.renderPreview(page);
														}
												})
										;
								}

								this.renderPreview(page);
						},

						template_change: function(e){
								var me = this,
										$target = $(e.target),
										value = $target.val()
										;

								this.currentPage.post({
										action: 'update_page_template',
										postId: this.currentPage.get('ID'),
										template: value
								}).done(function(response){
										if(me.currentPage.get('ID') == response.data.postId)
												me.currentPage.template = response.data.template;
								});
						}
				});

		});
}(jQuery));
