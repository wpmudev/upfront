(function($){
		var l10n = Upfront.Settings && Upfront.Settings.l10n
						? Upfront.Settings.l10n.global.views
						: Upfront.mainData.l10n.global.views
				;
		define([
				'scripts/upfront/upfront-views-editor/commands/command',
				'scripts/upfront/upfront-views-editor/content-editor'
		], function (Command, ContentEditor) {

				return ContentEditor.SidebarCommand.extend({
						tagName: 'li',
						className: 'command-popup-list',
						$popup: {},
						views: {},
						currentPanel: false,
						render: function () {
								this.$el.addClass("upfront-entity_list upfront-icon upfront-icon-browse");
								// Comment out comments functionality for now.
								//if ( Upfront.Application.is_single( "post" ) )
										//this.$el.html('<a title="'+ l10n.posts_pages_comments +'">' + l10n.posts_pages_comments + '</a>');
								//else
										this.$el.html('<a title="'+ l10n.posts_pages +'">' + l10n.posts_pages + '</a>');
						},
						on_click: function () {
								var me = this,
										popup = Upfront.Popup.open(function (data, $top, $bottom) {
												var $me = $(this);
												$me.empty()
														.append('<p class="upfront-popup-placeholder">' + l10n.popup_preloader + '</p>')
												;
												me.$popup = {
														"top": $top,
														"content": $me,
														"bottom": $bottom
												};
										})
										;
								// Add class for styling purposes.
								me.$popup.top.parent().addClass('upfront-popup-posts');
								var has_comments = false,
										current_post_id = Upfront.data.currentPost && Upfront.data.currentPost.id
												? Upfront.data.currentPost.id
												: _upfront_post_data.post_id
										;
								has_comments = !!current_post_id;
								if (current_post_id && Upfront.data.posts && Upfront.data.posts.length) {
										has_comments = Upfront.data.posts[current_post_id] && Upfront.data.posts[current_post_id].get
												? !!(parseInt(Upfront.data.posts[current_post_id].get("comment_count"), 10))
												: false
										;
								}
								me.$popup.top.html(
										'<ul class="upfront-tabs">' +
											'<li data-type="posts" class="active">' + l10n.posts + '</li>' +
											'<li data-type="pages">' + l10n.pages + '</li>' +
											'<li data-type="cpts">' + l10n.cpts + '</li>' +
											// Comment out comments functionality for now.
											//(has_comments ? '<li data-type="comments">' + l10n.comments + '</li>' : '') +
										'</ul>' +
										me.$popup.top.html()
									+ '<div class="upfront-icon upfront-icon-popup-search"></div>'
								).find('.upfront-tabs li').on("click", function () {
										me.dispatch_panel_creation(this);
								} );

								// Add Toggle Filter button functionality.
								me.$popup.top.find('.upfront-icon-popup-search').click(me.toggle_filter);

								me.dispatch_panel_creation();

								popup.done(function () {
										Upfront.Events.off("upfront:posts:sort");
										Upfront.Events.off("upfront:posts:post:expand");
										Upfront.Events.off("upfront:pages:sort");
										Upfront.Events.off("upfront:comments:sort");
								});
						},
						// Hide/Show filtering section.
						toggle_filter: function(e) {
							var filterSection = $(e.target).parents('.upfront-popup-posts').find('#upfront-entity_list-search');
							var contentSection = filterSection.parent();
							if (filterSection.css('display') === 'none') {
								contentSection.addClass('upfront-filter-panel-open');
								// Add class for correct height.
								return filterSection.slideToggle('fast');
							}
							// Remove class for correct height.
							contentSection.removeClass('upfront-filter-panel-open');
							return filterSection.slideToggle('fast');
						},
						dispatch_panel_creation: function (data) {
								var me = this,
										$el = data ? $(data) : me.$popup.top.find('.upfront-tabs li.active'),
										panel = $el.attr("data-type"),
										class_suffix = panel.charAt(0).toUpperCase() + panel.slice(1).toLowerCase(),
										send_data = data || {},
										collection = false,
										postId = this.post.id,
										fetchOptions = {}
										;

								me.$popup.top.find('.upfront-tabs li').removeClass('active');
								$el.addClass('active');

								this.currentPanel = panel;

								//Already loaded?
								if(me.views[panel]){
										if(panel != 'pages' && panel != 'posts') {
												if(panel != 'comments' || (Upfront.data.currentPost && Upfront.data.currentPost.id && me.views[panel].view.collection.postId == Upfront.data.currentPost.id))
														return this.render_panel(me.views[panel]);
										}
								}

								if(panel == 'posts'){
										collection = new Upfront.Collections.PostList([], {postType: 'post'});
										collection.orderby = 'post_date';
										fetchOptions = {filterContent: true, withAuthor: true, limit: 15};
								}
								else if(panel == 'pages'){
										collection = new Upfront.Collections.PostList([], {postType: 'page'});
										collection.orderby = 'post_date';
										fetchOptions = {limit: 15};
								}
								else if(panel == 'cpts'){
										var postTypes = Upfront.mainData.content_settings.post_types
											collection
										;
										postTypes.forEach(function(postType) {
											// Ignore WP post types.
											if (postType.name === 'post' || postType.name === 'page' || postType.name === 'attachmente') return;
											var newCollection = new Upfront.Collections.PostList([], {postType: postType});
											// If collection already exists, add to it.
											if (collection.add) {
												collection.add(newCollection.toJSON())
											} else {
												// Otherwise assign it.
												collection = newCollection;
											}
										});
										collection.orderby = 'post_date';
										fetchOptions = {limit: 15};
								}
								else{
										var post_id = Upfront.data.currentPost && Upfront.data.currentPost.id
														? Upfront.data.currentPost.id
														: _upfront_post_data.post_id
												;
										collection = new Upfront.Collections.CommentList([], {postId: post_id});
										collection.orderby = 'comment_date';
								}

								collection.fetch(fetchOptions).done(function(response){
					var cachedElements, collectionElements;
										switch(panel){
												case "posts":
														//Check if we have rendered the panel once
														cachedElements = null;
														if(typeof me.views[panel] !== "undefined") {
																cachedElements = me.views[panel].view.collection.pagination.totalElements;
														}
														//Check collection total elements
														collectionElements = collection.pagination.totalElements;

														//Compare total items, if same return cached panel
														if(cachedElements == collectionElements) {
																return me.render_panel(me.views[panel]);
														}

														collection.on('reset sort', me.render_panel, me);
														views = {
																view: new ContentEditor.Posts({collection: collection, $popup: me.$popup}),
																search: new ContentEditor.Search({collection: collection}),
																pagination: new ContentEditor.Pagination({collection: collection})
														};
														me.views.posts = views;
														break;
												case "pages":
														//Check if we have rendered the panel once
														cachedElements = null;
														if(typeof me.views[panel] !== "undefined") {
																cachedElements = me.views[panel].view.collection.pagination.totalElements;
														}
														//Check collection total elements
														collectionElements = collection.pagination.totalElements;

														//Compare total items, if same return cached panel
														if(cachedElements == collectionElements) {
																return me.render_panel(me.views[panel]);
														}

														collection.on('reset sort', me.render_panel, me);
														views = {
																view: new ContentEditor.Pages({collection: collection, $popup: me.$popup}),
																search: new ContentEditor.Search({collection: collection}),
																pagination: new ContentEditor.Pagination({collection: collection})
														};
														me.views.pages = views;
														break;
												case "comments":
														collection.on('reset sort', me.render_panel, me);
														views = {
																view: new ContentEditor.Comments({collection: collection, $popup: me.$popup}),
																search: new ContentEditor.Search({collection: collection}),
																pagination: new ContentEditor.Pagination({collection: collection})
														};
														me.views.comments = views;
														break;
												case "cpts":
														//Check if we have rendered the panel once
														cachedElements = null;
														if(typeof me.views[panel] !== "undefined") {
																cachedElements = me.views[panel].view.collection.pagination.totalElements;
														}
														//Check collection total elements
														collectionElements = collection.pagination.totalElements;

														//Compare total items, if same return cached panel
														if(cachedElements == collectionElements) {
																return me.render_panel(me.views[panel]);
														}

														collection.on('reset sort', me.render_panel, me);
														views = {
																view: new ContentEditor.Cpt({collection: collection, $popup: me.$popup}),
																search: new ContentEditor.Search({collection: collection}),
																pagination: new ContentEditor.Pagination({collection: collection})
														};
														me.views.cpts = views;
														break;
										}
										me.render_panel();
								});

								return false;
						},

						render_panel: function(){
								var me = this,
										views = this.views[this.currentPanel];

								// Content
								views.view.render();
								me.$popup.content.html(views.view.$el);
								views.view.setElement(views.view.$el);

								// Search.
								views.search.render();
								me.$popup.content.prepend(views.search.$el);
								views.search.setElement(views.search.$el);

								// Clear Bottom.
								me.$popup.bottom.empty();
								// Pagination.
								if (views.pagination) {
										views.pagination.render();
										me.$popup.bottom.html(views.pagination.$el);
										views.pagination.setElement(views.pagination.$el);
								}
						},
						// Handle filtering.
						handle_filter: function(e) {
							// Get values of filters UI.
							var filterValues = this.get_filter_values();
							// Store Original Models.
							if (typeof this.originalModels === 'undefined') {
								this.originalModels = this.collection.models;
							}
							// Object for fetching posts.
							filterObject = {
								post_status: filterValues.post_status,
								post_date: filterValues.post_date,
								category: filterValues.category
							};
							filterObject[name] = value;
							// Get models that match filter.
							var newModels = this.collection.where(filterObject);
							this.collection.reset(newModels);
						},

					get_filter_values: function() {
							//temp
							post_status = 'draft';
							//temp
							post_date = 'all';
							//temp
							category = 'all';
							return {
								post_status: post_status,
								post_date: post_date,
								category: category
							};
						},

						
				});

		});
}(jQuery));
