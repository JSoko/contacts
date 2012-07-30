function ucwords (str) {
	return (str + '').replace(/^([a-z])|\s+([a-z])/g, function ($1) {
		return $1.toUpperCase();
	});
}

String.prototype.strip_tags = function(){
	tags = this;
	stripped = tags.replace(/<(.|\n)*?>/g, '');
	return stripped;
};

Contacts={
	UI:{
		/**
		 * Arguments:
		 * message: The text message to show.
		 * timeout: The timeout in seconds before the notification disappears. Default 10.
		 * timeouthandler: A function to run on timeout.
		 * clickhandler: A function to run on click. If a timeouthandler is given it will be cancelled.
		 * data: An object that will be passed as argument to the timeouthandler and clickhandler functions.
		 * cancel: If set cancel all ongoing timer events and hide the notification.
		 */
		notify:function(params) {
			self = this;
			if(!self.notifier) {
				self.notifier = $('#notification');
			}
			if(params.cancel) {
				self.notifier.off('click');
				for(var id in self.notifier.data()) {
					if($.isNumeric(id)) {
						clearTimeout(parseInt(id));
					}
				}
				self.notifier.text('').fadeOut().removeData();
				return;
			}
			self.notifier.text(params.message);
			self.notifier.fadeIn();
			self.notifier.on('click', function() { $(this).fadeOut();});
			var timer = setTimeout(function() {
				self.notifier.fadeOut();
				if(params.timeouthandler && $.isFunction(params.timeouthandler)) {
					params.timeouthandler(self.notifier.data(dataid));
					self.notifier.off('click');
					self.notifier.removeData(dataid);
				}
			}, params.timeout && $.isNumeric(params.timeout) ? parseInt(params.timeout)*1000 : 10000);
			var dataid = timer.toString();
			if(params.data) {
				self.notifier.data(dataid, params.data);
			}
			if(params.clickhandler && $.isFunction(params.clickhandler)) {
				self.notifier.on('click', function() {
					clearTimeout(timer);
					self.notifier.off('click');
					params.clickhandler(self.notifier.data(dataid));
					self.notifier.removeData(dataid);
				});
			}
		},
		notImplemented:function() {
			OC.dialogs.alert(t('contacts', 'Sorry, this functionality has not been implemented yet'), t('contacts', 'Not implemented'));
		},
		searchOSM:function(obj) {
			var adr = Contacts.UI.propertyContainerFor(obj).find('.adr').val();
			if(adr == undefined) {
				OC.dialogs.alert(t('contacts', 'Couldn\'t get a valid address.'), t('contacts', 'Error'));
				return;
			}
			// FIXME: I suck at regexp. /Tanghus
			var adrarr = adr.split(';');
			var adrstr = '';
			if(adrarr[2].trim() != '') {
				adrstr = adrstr + adrarr[2].trim() + ',';
			}
			if(adrarr[3].trim() != '') {
				adrstr = adrstr + adrarr[3].trim() + ',';
			}
			if(adrarr[4].trim() != '') {
				adrstr = adrstr + adrarr[4].trim() + ',';
			}
			if(adrarr[5].trim() != '') {
				adrstr = adrstr + adrarr[5].trim() + ',';
			}
			if(adrarr[6].trim() != '') {
				adrstr = adrstr + adrarr[6].trim();
			}
			adrstr = encodeURIComponent(adrstr);
			var uri = 'http://open.mapquestapi.com/nominatim/v1/search.php?q=' + adrstr + '&limit=10&addressdetails=1&polygon=1&zoom=';
			var newWindow = window.open(uri,'_blank');
			newWindow.focus();
		},
		mailTo:function(obj) {
			var adr = Contacts.UI.propertyContainerFor($(obj)).find('input[type="email"]').val().trim();
			if(adr == '') {
				OC.dialogs.alert(t('contacts', 'Please enter an email address.'), t('contacts', 'Error'));
				return;
			}
			window.location.href='mailto:' + adr;
		},
		propertyContainerFor:function(obj) {
			return $(obj).parents('.propertycontainer').first();
		},
		checksumFor:function(obj) {
			return $(obj).parents('.propertycontainer').first().data('checksum');
		},
		propertyTypeFor:function(obj) {
			return $(obj).parents('.propertycontainer').first().data('element');
		},
		loading:function(obj, state) {
			if(state) {
				$(obj).addClass('loading');
			} else {
				$(obj).removeClass('loading');
			}
		},
		showCardDAVUrl:function(username, bookname){
			$('#carddav_url').val(totalurl + '/' + username + '/' + decodeURIComponent(bookname));
			$('#carddav_url').show();
			$('#carddav_url_close').show();
		},
		loadListHandlers:function() {
			$('.propertylist li a.delete').unbind('click');
			$('.propertylist li a.delete').unbind('keydown');
			var deleteItem = function(obj) {
				obj.tipsy('hide');
				Contacts.UI.Card.deleteProperty(obj, 'list');
			}
			$('.propertylist li a.delete, .addresscard .delete').click(function() { deleteItem($(this)) });
			$('.propertylist li a.delete, .addresscard .delete').keydown(function() { deleteItem($(this)) });
			$('.propertylist li a.mail').click(function() { Contacts.UI.mailTo(this) });
			$('.propertylist li a.mail').keydown(function() { Contacts.UI.mailTo(this) });
			$('.addresscard .globe').click(function() { $(this).tipsy('hide');Contacts.UI.searchOSM(this); });
			$('.addresscard .globe').keydown(function() { $(this).tipsy('hide');Contacts.UI.searchOSM(this); });
			$('.addresscard .edit').click(function() { $(this).tipsy('hide');Contacts.UI.Card.editAddress(this, false); });
			$('.addresscard .edit').keydown(function() { $(this).tipsy('hide');Contacts.UI.Card.editAddress(this, false); });
			$('.addresscard,.propertylist li,.propertycontainer').hover(
				function () {
					$(this).find('.globe,.mail,.delete,.edit').animate({ opacity: 1.0 }, 200, function() {});
				},
				function () {
					$(this).find('.globe,.mail,.delete,.edit').animate({ opacity: 0.1 }, 200, function() {});
				}
			);
		},
		loadHandlers:function() {
			var deleteItem = function(obj) {
				obj.tipsy('hide');
				Contacts.UI.Card.deleteProperty(obj, 'single');
			}

			var goToUrl = function(obj) {
				var url = Contacts.UI.propertyContainerFor(obj).find('#url').val();
				if(url != '') {
					var newWindow = window.open(url,'_blank');
					newWindow.focus();
				}
			}

			$('#identityprops a.delete').click( function() { deleteItem($(this)) });
			$('#identityprops a.delete').keydown( function() { deleteItem($(this)) });
			$('#categories_value a.edit').click( function() { $(this).tipsy('hide');OCCategories.edit(); } );
			$('#categories_value a.edit').keydown( function() { $(this).tipsy('hide');OCCategories.edit(); } );
			$('#url_value a.globe').click( function() { $(this).tipsy('hide');goToUrl($(this)); } );
			$('#url_value a.globe').keydown( function() { $(this).tipsy('hide');goToUrl($(this)); } );
			$('#fn_select').combobox({
				'id': 'fn',
				'name': 'value',
				'classes': ['contacts_property', 'nonempty', 'huge', 'tip', 'float'],
				'attributes': {'placeholder': t('contacts', 'Enter name')},
				'title': t('contacts', 'Format custom, Short name, Full name, Reverse or Reverse with comma')});
			$('#bday').datepicker({
						dateFormat : 'dd-mm-yy'
			});
			// Style phone types
			$('#phonelist').find('select.contacts_property').multiselect({
													noneSelectedText: t('contacts', 'Select type'),
													header: false,
													selectedList: 4,
													classes: 'typelist'
												});
			$('#edit_name').click(function(){Contacts.UI.Card.editName()});
			$('#edit_name').keydown(function(){Contacts.UI.Card.editName()});

			$('#phototools li a').click(function() {
				$(this).tipsy('hide');
			});
			$('#contacts_details_photo_wrapper').hover(
				function () {
					$('#phototools').slideDown(200);
				},
				function () {
					$('#phototools').slideUp(200);
				}
			);
			$('#phototools').hover(
				function () {
					$(this).removeClass('transparent');
				},
				function () {
					$(this).addClass('transparent');
				}
			);
			$('#phototools .upload').click(function() {
				$('#file_upload_start').trigger('click');
			});
			$('#phototools .cloud').click(function() {
				OC.dialogs.filepicker(t('contacts', 'Select photo'), Contacts.UI.Card.cloudPhotoSelected, false, 'image', true);
			});
			/* Initialize the photo edit dialog */
			$('#edit_photo_dialog').dialog({
				autoOpen: false, modal: true, height: 'auto', width: 'auto'
			});
			$('#edit_photo_dialog' ).dialog( 'option', 'buttons', [
				{
					text: "Ok",
					click: function() {
						Contacts.UI.Card.savePhoto(this);
						$(this).dialog('close');
					}
				},
				{
					text: "Cancel",
					click: function() { $(this).dialog('close'); }
				}
			] );

			// Name has changed. Update it and reorder.
			$('#fn').change(function(){
				var name = $('#fn').val().strip_tags();
				var item = $('.contacts li[data-id="'+Contacts.UI.Card.id+'"]').detach();
				$(item).find('a').html(name);
				Contacts.UI.Card.fn = name;
				Contacts.UI.Contacts.insertContact({contact:item});
				Contacts.UI.Contacts.scrollTo(Contacts.UI.Card.id);
			});

			$('#contacts_deletecard').click( function() { Contacts.UI.Card.delayedDelete();return false;} );
			$('#contacts_deletecard').keydown( function(event) {
				if(event.which == 13 || event.which == 32) {
					Contacts.UI.Card.delayedDelete();
				}
				return false;
			});

			$('#contacts_downloadcard').click( function() { Contacts.UI.Card.doExport();return false;} );
			$('#contacts_downloadcard').keydown( function(event) {
				if(event.which == 13 || event.which == 32) {
					Contacts.UI.Card.doExport();
				}
				return false;
			});

			// Profile picture upload handling
			// New profile picture selected
			$('#file_upload_start').change(function(){
				Contacts.UI.Card.uploadPhoto(this.files);
			});
			$('#contacts_details_photo_wrapper').bind('dragover',function(event){
				$(event.target).addClass('droppable');
				event.stopPropagation();
				event.preventDefault();
			});
			$('#contacts_details_photo_wrapper').bind('dragleave',function(event){
				$(event.target).removeClass('droppable');
				//event.stopPropagation();
				//event.preventDefault();
			});
			$('#contacts_details_photo_wrapper').bind('drop',function(event){
				event.stopPropagation();
				event.preventDefault();
				$(event.target).removeClass('droppable');
				$.fileUpload(event.originalEvent.dataTransfer.files);
			});

			$('#categories').multiple_autocomplete({source: categories});
			$('#contacts_deletecard').tipsy({gravity: 'ne'});
			$('#contacts_downloadcard').tipsy({gravity: 'ne'});
			$('#contacts_propertymenu_button').tipsy();
			$('#contacts_newcontact, #contacts_import, #chooseaddressbook').tipsy({gravity: 'sw'});

			$('body').click(function(e){
				if(!$(e.target).is('#contacts_propertymenu_button')) {
					$('#contacts_propertymenu_dropdown').hide();
				}
			});
			function propertyMenu(){
				var menu = $('#contacts_propertymenu_dropdown');
				if(menu.is(':hidden')) {
					menu.show();
					menu.find('li').first().focus();
				} else {
					menu.hide();
				}
			}
			$('#contacts_propertymenu_button').click(propertyMenu);
			$('#contacts_propertymenu_button').keydown(propertyMenu);
			function propertyMenuItem(){
				var type = $(this).data('type');
				Contacts.UI.Card.addProperty(type);
				$('#contacts_propertymenu_dropdown').hide();
			}
			$('#contacts_propertymenu_dropdown a').click(propertyMenuItem);
			$('#contacts_propertymenu_dropdown a').keydown(propertyMenuItem);
		},
		Card:{
			update:function(params) { // params {cid:int, aid:int}
				if(!params) { params = {}; }
				$('#contacts li,#contacts h3').removeClass('active');
				console.log('Card, cid: ' + params.cid + ' aid: ' + params.aid);
				var newid, bookid, firstitem;
				if(!parseInt(params.cid) && !parseInt(params.aid)) {
					firstitem = $('#contacts ul').first().find('li:first-child');
					if(firstitem.length > 0) {
						newid = parseInt(firstitem.data('id'));
						bookid = parseInt(firstitem.data('bookid'));
					}
				} else if(!parseInt(params.cid) && parseInt(params.aid)) {
					bookid = parseInt(params.aid);
					newid = parseInt($('#contacts').find('li[data-bookid="'+bookid+'"]').first().data('id'));
				} else if(parseInt(params.cid) && !parseInt(params.aid)) {
					newid = parseInt(params.cid);
					var listitem = Contacts.UI.Contacts.getContact(newid); //$('#contacts li[data-id="'+newid+'"]');
					console.log('Is contact in list? ' + listitem.length);
					if(listitem.length) {
						//bookid = parseInt($('#contacts li[data-id="'+newid+'"]').data('bookid'));
						bookid = parseInt(Contacts.UI.Contacts.getContact(newid).data('bookid'));
					} else { // contact isn't in list yet.
						bookid = 'unknown';
					}
				} else {
					newid = parseInt(params.cid);
					bookid = parseInt(params.aid);
				}
				if(!bookid || !newid) {
					bookid = parseInt($('#contacts h3').first().data('id'));
					newid = parseInt($('#contacts').find('li[data-bookid="'+bookid+'"]').first().data('id'));
				}
				console.log('newid: ' + newid + ' bookid: ' +bookid);
				var localLoadContact = function(newid, bookid) {
					if($('.contacts li').length > 0) {
						$.getJSON(OC.filePath('contacts', 'ajax', 'contactdetails.php'),{'id':newid},function(jsondata){
							if(jsondata.status == 'success'){
								if(bookid == 'unknown') {
									bookid = jsondata.data.addressbookid;
									var contact = Contacts.UI.Contacts.insertContact({
										contactlist:$('#contacts ul[data-id="'+bookid+'"]'),
										data:jsondata.data
									});
								}
								$('#contacts li[data-id="'+newid+'"],#contacts h3[data-id="'+bookid+'"]').addClass('active');
								$('#contacts ul[data-id="'+bookid+'"]').slideDown(300);
								Contacts.UI.Card.loadContact(jsondata.data, bookid);
								Contacts.UI.Contacts.scrollTo(newid);
							} else {
								OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
							}
						});
					}
				}

				// Make sure proper DOM is loaded.
				if(!$('#card').length && newid) {
					console.log('Loading card DOM');
					$.getJSON(OC.filePath('contacts', 'ajax', 'loadcard.php'),{requesttoken:requesttoken},function(jsondata){
						if(jsondata.status == 'success'){
							$('#rightcontent').html(jsondata.data.page).ready(function() {
								Contacts.UI.loadHandlers();
								localLoadContact(newid, bookid);
							});
						} else {
							OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
						}
					});
				}
				else if(!newid) {
					console.log('Loading intro');
					// load intro page
					$.getJSON(OC.filePath('contacts', 'ajax', 'loadintro.php'),{},function(jsondata){
						if(jsondata.status == 'success'){
							id = '';
							$('#rightcontent').data('id','');
							$('#rightcontent').html(jsondata.data.page);
						} else {
							OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
						}
					});
				}
				else {
					localLoadContact(newid, bookid);
				}
			},
			doExport:function() {
				document.location.href = OC.linkTo('contacts', 'export.php') + '?contactid=' + this.id;
			},
			editNew:function(){ // add a new contact
				this.id = ''; this.fn = ''; this.fullname = ''; this.givname = ''; this.famname = ''; this.addname = ''; this.honpre = ''; this.honsuf = '';
				//Contacts.UI.Card.add(t('contacts', 'Contact')+';'+t('contacts', 'New')+';;;', t('contacts', 'New Contact'), '', true);
				Contacts.UI.Card.add(';;;;;', '', '', true);
				return false;
			},
			add:function(n, fn, aid, isnew){ // add a new contact
				console.log('Adding ' + fn);
				aid = aid?aid:$('#contacts h3.active').first().data('id');
				var localAddcontact = function(n, fn, aid, isnew) {
					$.post(OC.filePath('contacts', 'ajax', 'addcontact.php'), { n: n, fn: fn, aid: aid, isnew: isnew },
					function(jsondata) {
						if (jsondata.status == 'success'){
							$('#rightcontent').data('id',jsondata.data.id);
							var id = jsondata.data.id;
							var aid = jsondata.data.aid;
							$.getJSON(OC.filePath('contacts', 'ajax', 'contactdetails.php'),{'id':id},function(jsondata){
								if(jsondata.status == 'success'){
									Contacts.UI.Card.loadContact(jsondata.data, aid);
									var item = Contacts.UI.Contacts.insertContact({data:jsondata.data});
									if(isnew) { // add some default properties
										Contacts.UI.Card.addProperty('EMAIL');
										Contacts.UI.Card.addProperty('TEL');
										$('#fn').focus();
									}
								}
								else{
									OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
								}
							});
							$('#contact_identity').show();
							$('#actionbar').show();
						}
						else{
							OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
						}
					});
				}

				if(!$('#card').length) {
					console.log('Loading card DOM');
					$.getJSON(OC.filePath('contacts', 'ajax', 'loadcard.php'),{'requesttoken': requesttoken},function(jsondata){
						if(jsondata.status == 'success'){
							$('#rightcontent').html(jsondata.data.page).ready(function() {
								Contacts.UI.loadHandlers();
								localAddcontact(n, fn, aid, isnew);
							});
						} else{
							OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
						}
					});
				} else {
					localAddcontact(n, fn, aid, isnew);
				}
			},
			delayedDelete:function() {
				/* TODO:
				$(window).unload(function() {
					deleteFilesInQueue();
				});
				*/
				$('#contacts_deletecard').tipsy('hide');
				var newid = '', bookid;
				var curlistitem = Contacts.UI.Contacts.getContact(this.id);
				curlistitem.removeClass('active');
				var newlistitem = curlistitem.prev('li');
				if(!newlistitem) {
					newlistitem = curlistitem.next('li');
				}
				curlistitem.detach();
				if($(newlistitem).is('li')) {
					newid = newlistitem.data('id');
					bookid = newlistitem.data('bookid');
				}
				$('#rightcontent').data('id', newid);

				Contacts.UI.Contacts.deletionQueue.push(this.id);
				if(!window.onbeforeunload) {
					window.onbeforeunload = Contacts.UI.Contacts.warnNotDeleted;
				}

				with(this) {
					delete id; delete fn; delete fullname; delete shortname; delete famname;
					delete givname; delete addname; delete honpre; delete honsuf; delete data;
				}

				if($('.contacts li').length > 0) {
					Contacts.UI.Card.update({cid:newid, aid:bookid});
				} else {
					// load intro page
					$.getJSON(OC.filePath('contacts', 'ajax', 'loadintro.php'),{},function(jsondata){
						if(jsondata.status == 'success'){
							id = '';
							$('#rightcontent').html(jsondata.data.page).removeData('id');
						}
						else{
							OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
						}
					});
				}
				Contacts.UI.notify({
					data:curlistitem,
					message:t('contacts','Click to undo deletion of "') + curlistitem.find('a').text() + '"',
					timeouthandler:function(contact) {
						Contacts.UI.Card.doDelete(contact.data('id'), true);
						delete contact;
					},
					clickhandler:function(contact) {
						Contacts.UI.Contacts.insertContact({contact:contact});
						Contacts.UI.notify({message:t('contacts', 'Cancelled deletion of: "') + curlistitem.find('a').text() + '"'});
					}
				});
			},
			doDelete:function(id, removeFromQueue) {
				if(Contacts.UI.Contacts.deletionQueue.indexOf(id) == -1 && removeFromQueue) {
					return;
				}
				$.post(OC.filePath('contacts', 'ajax', 'deletecard.php'),{'id':id},function(jsondata) {
					if(jsondata.status == 'error'){
						OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
					}
					if(removeFromQueue) {
						Contacts.UI.Contacts.deletionQueue.splice(Contacts.UI.Contacts.deletionQueue.indexOf(id), 1);
					}
					if(Contacts.UI.Contacts.deletionQueue.length == 0) {
						window.onbeforeunload = null;
					}
				});
			},
			loadContact:function(jsondata, bookid){
				this.data = jsondata;
				this.id = this.data.id;
				this.bookid = bookid;
				$('#rightcontent').data('id',this.id);
				this.populateNameFields();
				this.loadPhoto();
				this.loadMails();
				this.loadPhones();
				this.loadAddresses();
				this.loadSingleProperties();
				Contacts.UI.loadListHandlers();
				var note = $('#note');
				if(this.data.NOTE) {
					note.data('checksum', this.data.NOTE[0]['checksum']);
					var textarea = note.find('textarea');
					var txt = this.data.NOTE[0]['value'];
					var nheight = txt.split('\n').length > 4 ? txt.split('\n').length+2 : 5;
					textarea.css('min-height', nheight+'em');
					textarea.attr('rows', nheight);
					textarea.val(txt);
					note.show();
					textarea.expandingTextarea();
					$('#contacts_propertymenu_dropdown a[data-type="NOTE"]').parent().hide();
				} else {
					note.removeData('checksum');
					note.find('textarea').val('');
					note.hide();
					$('#contacts_propertymenu_dropdown a[data-type="NOTE"]').parent().show();
				}
			},
			loadSingleProperties:function() {
				var props = ['BDAY', 'NICKNAME', 'ORG', 'URL', 'CATEGORIES'];
				// Clear all elements
				$('#ident .propertycontainer').each(function(){
					if(props.indexOf($(this).data('element')) > -1) {
						$(this).data('checksum', '');
						$(this).find('input').val('');
						$(this).hide();
						$(this).prev().hide();
					}
				});
				for(var prop in props) {
					var propname = props[prop];
					if(this.data[propname] != undefined) {
						$('#contacts_propertymenu_dropdown a[data-type="'+propname+'"]').parent().hide();
						var property = this.data[propname][0];
						var value = property['value'], checksum = property['checksum'];

						if(propname == 'BDAY') {
							var val = $.datepicker.parseDate('yy-mm-dd', value.substring(0, 10));
							value = $.datepicker.formatDate('dd-mm-yy', val);
						}
						var identcontainer = $('#contact_identity');
						identcontainer.find('#'+propname.toLowerCase()).val(value);
						identcontainer.find('#'+propname.toLowerCase()+'_value').data('checksum', checksum);
						identcontainer.find('#'+propname.toLowerCase()+'_label').show();
						identcontainer.find('#'+propname.toLowerCase()+'_value').show();
					} else {
						$('#contacts_propertymenu_dropdown a[data-type="'+propname+'"]').parent().show();
					}
				}
			},
			populateNameFields:function() {
				var props = ['FN', 'N'];
				// Clear all elements
				$('#ident .propertycontainer').each(function(){
					if(props.indexOf($(this).data('element')) > -1) {
						$(this).data('checksum', '');
						$(this).find('input').val('');
					}
				});

				with(this) {
					delete fn; delete fullname; delete givname; delete famname;
					delete addname; delete honpre; delete honsuf;
				}

				if(this.data.FN) {
					this.fn = this.data.FN[0]['value'];
				}
				else {
					this.fn = '';
				}
				if(this.data.N == undefined) {
					narray = [this.fn,'','','','']; // Checking for non-existing 'N' property :-P
				} else {
					narray = this.data.N[0]['value'];
				}
				this.famname = narray[0] || '';
				this.givname = narray[1] || '';
				this.addname = narray[2] || '';
				this.honpre = narray[3] || '';
				this.honsuf = narray[4] || '';
				if(this.honpre.length > 0) {
					this.fullname += this.honpre + ' ';
				}
				if(this.givname.length > 0) {
					this.fullname += ' ' + this.givname;
				}
				if(this.addname.length > 0) {
					this.fullname += ' ' + this.addname;
				}
				if(this.famname.length > 0) {
					this.fullname += ' ' + this.famname;
				}
				if(this.honsuf.length > 0) {
					this.fullname += ', ' + this.honsuf;
				}
				$('#n').val(narray.join(';'));
				$('#fn_select option').remove();
				var names = [this.fn, this.fullname, this.givname + ' ' + this.famname, this.famname + ' ' + this.givname, this.famname + ', ' + this.givname];
				if(this.data.ORG) {
					names[names.length]=this.data.ORG[0].value;
				}
				$.each(names, function(key, value) {
					$('#fn_select')
						.append($('<option></option>')
						.text(value));
				});
				$('#fn_select').combobox('value', this.fn);
				$('#contact_identity').find('*[data-element="N"]').data('checksum', this.data.N[0]['checksum']);
				if(this.data.FN) {
					$('#contact_identity').find('*[data-element="FN"]').data('checksum', this.data.FN[0]['checksum']);
				}
				$('#contact_identity').show();
			},
			hasCategory:function(category) {
				if(this.data.CATEGORIES) {
					var categories = this.data.CATEGORIES[0]['value'].split(/,\s*/);
					for(var c in categories) {
						var cat = this.data.CATEGORIES[0]['value'][c];
						if(typeof cat === 'string' && (cat.toUpperCase() === category.toUpperCase())) {
							return true;
						}
					}
				}
				return false;
			},
			categoriesChanged:function(newcategories) { // Categories added/deleted.
				categories = $.map(newcategories, function(v) {return v;});
				$('#categories').multiple_autocomplete('option', 'source', categories);
				var categorylist = $('#categories_value').find('input');
				$.getJSON(OC.filePath('contacts', 'ajax', 'categories/categoriesfor.php'),{'id':Contacts.UI.Card.id},function(jsondata){
					if(jsondata.status == 'success'){
						$('#categories_value').data('checksum', jsondata.data.checksum);
						categorylist.val(jsondata.data.value);
					} else {
						OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
					}
				});
			},
			savePropertyInternal:function(name, fields, oldchecksum, checksum){
				// TODO: Add functionality for new fields.
				//console.log('savePropertyInternal: ' + name + ', fields: ' + fields + 'checksum: ' + checksum);
				//console.log('savePropertyInternal: ' + this.data[name]);
				var multivalue = ['CATEGORIES'];
				var params = {};
				var value = multivalue.indexOf(name) != -1 ? new Array() : undefined;
				jQuery.each(fields, function(i, field){
					//.substring(11,'parameters[TYPE][]'.indexOf(']'))
					if(field.name.substring(0, 5) === 'value') {
						if(multivalue.indexOf(name) != -1) {
							value.push(field.value);
						} else {
							value = field.value;
						}
					} else if(field.name.substring(0, 10) === 'parameters') {
						var p = field.name.substring(11,'parameters[TYPE][]'.indexOf(']'));
						if(!(p in params)) {
							params[p] = [];
						}
						params[p].push(field.value);
					}
				});
				for(var i in this.data[name]) {
					if(this.data[name][i]['checksum'] == oldchecksum) {
						this.data[name][i]['checksum'] = checksum;
						this.data[name][i]['value'] = value;
						this.data[name][i]['parameters'] = params;
					}
				}
			},
			saveProperty:function(obj){
				if(!$(obj).hasClass('contacts_property')) {
					return false;
				}
				if($(obj).hasClass('nonempty') && $(obj).val().trim() == '') {
					OC.dialogs.alert(t('contacts', 'This property has to be non-empty.'), t('contacts', 'Error'));
					return false;
				}
				container = $(obj).parents('.propertycontainer').first(); // get the parent holding the metadata.
				Contacts.UI.loading(obj, true);
				var checksum = container.data('checksum');
				var name = container.data('element');
				var fields = container.find('input.contacts_property,select.contacts_property').serializeArray();
				switch(name) {
					case 'FN':
						var nempty = true;
						for(var i in Contacts.UI.Card.data.N[0]['value']) {
							if(Contacts.UI.Card.data.N[0]['value'][i] != '') {
								nempty = false;
								break;
							}
						}
						if(nempty) {
							$('#n').val(fields[0].value + ';;;;');
							Contacts.UI.Card.data.N[0]['value'] = Array(fields[0].value, '', '', '', '');
							setTimeout(function() {Contacts.UI.Card.saveProperty($('#n'))}, 500);
						}
						break;
				}
				var q = container.find('input.contacts_property,select.contacts_property,textarea.contacts_property').serialize();
				if(q == '' || q == undefined) {
					OC.dialogs.alert(t('contacts', 'Couldn\'t serialize elements.'), t('contacts', 'Error'));
					Contacts.UI.loading(obj, false);
					return false;
				}
				q = q + '&id=' + this.id + '&name=' + name;
				if(checksum != undefined && checksum != '') { // save
					q = q + '&checksum=' + checksum;
					console.log('Saving: ' + q);
					$(obj).attr('disabled', 'disabled');
					$.post(OC.filePath('contacts', 'ajax', 'saveproperty.php'),q,function(jsondata){
						if(jsondata.status == 'success'){
							container.data('checksum', jsondata.data.checksum);
							Contacts.UI.Card.savePropertyInternal(name, fields, checksum, jsondata.data.checksum);
							Contacts.UI.loading(obj, false);
							$(obj).removeAttr('disabled');
							return true;
						}
						else{
							OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
							Contacts.UI.loading(obj, false);
							$(obj).removeAttr('disabled');
							return false;
						}
					},'json');
				} else { // add
					console.log('Adding: ' + q);
					$(obj).attr('disabled', 'disabled');
					$.post(OC.filePath('contacts', 'ajax', 'addproperty.php'),q,function(jsondata){
						if(jsondata.status == 'success'){
							container.data('checksum', jsondata.data.checksum);
							// TODO: savePropertyInternal doesn't know about new fields
							//Contacts.UI.Card.savePropertyInternal(name, fields, checksum, jsondata.data.checksum);
							Contacts.UI.loading(obj, false);
							$(obj).removeAttr('disabled');
							return true;
						}
						else{
							OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
							Contacts.UI.loading(obj, false);
							$(obj).removeAttr('disabled');
							return false;
						}
					},'json');
				}
			},
			addProperty:function(type){
				switch (type) {
					case 'NOTE':
						$('#contacts_propertymenu_dropdown a[data-type="'+type+'"]').parent().hide();
						$('#note').find('textarea').expandingTextarea().show().focus();
						break;
					case 'EMAIL':
						if($('#emaillist>li').length == 1) {
							$('#emails').show();
						}
						Contacts.UI.Card.addMail();
						break;
					case 'TEL':
						if($('#phonelist>li').length == 1) {
							$('#phones').show();
						}
						Contacts.UI.Card.addPhone();
						break;
					case 'ADR':
						if($('#addressdisplay>dl').length == 1) {
							$('#addresses').show();
						}
						Contacts.UI.Card.editAddress('new', true);
						break;
					case 'NICKNAME':
					case 'URL':
					case 'ORG':
					case 'BDAY':
					case 'CATEGORIES':
						$('dl dt[data-element="'+type+'"],dd[data-element="'+type+'"]').show();
						$('dd[data-element="'+type+'"]').find('input').focus();
						$('#contacts_propertymenu_dropdown a[data-type="'+type+'"]').parent().hide();
						break;
				}
			},
			deleteProperty:function(obj, type){
				console.log('deleteProperty');
				Contacts.UI.loading(obj, true);
				var checksum = Contacts.UI.checksumFor(obj);
				if(checksum) {
					$.post(OC.filePath('contacts', 'ajax', 'deleteproperty.php'),{'id': this.id, 'checksum': checksum },function(jsondata){
						if(jsondata.status == 'success'){
							if(type == 'list') {
								Contacts.UI.propertyContainerFor(obj).remove();
							} else if(type == 'single') {
								var proptype = Contacts.UI.propertyTypeFor(obj);
								Contacts.UI.Card.data[proptype] = null;
								var othertypes = ['NOTE', 'PHOTO'];
								if(othertypes.indexOf(proptype) != -1) {
									Contacts.UI.propertyContainerFor(obj).data('checksum', '');
									if(proptype == 'PHOTO') {
										Contacts.UI.Contacts.refreshThumbnail(Contacts.UI.Card.id);
										Contacts.UI.Card.loadPhoto(true);
									} else if(proptype == 'NOTE') {
										$('#note').find('textarea').val('');
										Contacts.UI.propertyContainerFor(obj).hide();
									}
								} else {
									$('dl dt[data-element="'+proptype+'"],dd[data-element="'+proptype+'"]').hide();
									$('dl dd[data-element="'+proptype+'"]').data('checksum', '').find('input').val('');
								}
								$('#contacts_propertymenu_dropdown a[data-type="'+proptype+'"]').parent().show();
								Contacts.UI.loading(obj, false);
							} else {
								OC.dialogs.alert(t('contacts', '\'deleteProperty\' called without type argument. Please report at bugs.owncloud.org'), t('contacts', 'Error'));
								Contacts.UI.loading(obj, false);
							}
						}
						else{
							Contacts.UI.loading(obj, false);
							OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
						}
					});
				} else { // Property hasn't been saved so there's nothing to delete.
					if(type == 'list') {
						Contacts.UI.propertyContainerFor(obj).remove();
					} else if(type == 'single') {
						var proptype = Contacts.UI.propertyTypeFor(obj);
						$('dl dt[data-element="'+proptype+'"],dd[data-element="'+proptype+'"]').hide();
						$('#contacts_propertymenu_dropdown a[data-type="'+proptype+'"]').parent().show();
						Contacts.UI.loading(obj, false);
					} else {
						OC.dialogs.alert(t('contacts', '\'deleteProperty\' called without type argument. Please report at bugs.owncloud.org'), t('contacts', 'Error'));
					}
				}
			},
			editName:function() {
				var params = {id: this.id};
				/* Initialize the name edit dialog */
				if($('#edit_name_dialog').dialog('isOpen') == true) {
					$('#edit_name_dialog').dialog('moveToTop');
				} else {
					$.getJSON(OC.filePath('contacts', 'ajax', 'editname.php'),{id: this.id},function(jsondata) {
						if(jsondata.status == 'success') {
							$('body').append('<div id="name_dialog"></div>');
							$('#name_dialog').html(jsondata.data.page).find('#edit_name_dialog' ).dialog({
								modal: true,
								closeOnEscape: true,
								title:  t('contacts', 'Edit name'),
								height: 'auto', width: 'auto',
								buttons: {
									'Ok':function() {
										Contacts.UI.Card.saveName(this);
										$(this).dialog('close');
									},
									'Cancel':function() { $(this).dialog('close'); }
								},
								close: function(event, ui) {
									$(this).dialog('destroy').remove();
									$('#name_dialog').remove();
								},
								open: function(event, ui) {
									// load 'N' property - maybe :-P
								}
							});
						} else {
							OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
						}
					});
				}
			},
			saveName:function(dlg){
				//console.log('saveName, id: ' + this.id);
				var n = new Array($(dlg).find('#fam').val().strip_tags(),$(dlg).find('#giv').val().strip_tags(),$(dlg).find('#add').val().strip_tags(),$(dlg).find('#pre').val().strip_tags(),$(dlg).find('#suf').val().strip_tags());
				this.famname = n[0];
				this.givname = n[1];
				this.addname = n[2];
				this.honpre = n[3];
				this.honsuf = n[4];
				this.fullname = '';

				$('#n').val(n.join(';'));
				if(n[3].length > 0) {
					this.fullname = n[3] + ' ';
				}
				this.fullname += n[1] + ' ' + n[2] + ' ' + n[0];
				if(n[4].length > 0) {
					this.fullname += ', ' + n[4];
				}

				$('#fn_select option').remove();
				//$('#fn_select').combobox('value', this.fn);
				var tmp = [this.fullname, this.givname + ' ' + this.famname, this.famname + ' ' + this.givname, this.famname + ', ' + this.givname];
				var names = new Array();
				for(var name in tmp) {
					if(names.indexOf(tmp[name]) == -1) {
						names.push(tmp[name]);
					}
				}
				$.each(names, function(key, value) {
					$('#fn_select')
						.append($('<option></option>')
						.text(value));
				});

				if(this.id == '') {
					var aid = $(dlg).find('#aid').val();
					Contacts.UI.Card.add(n.join(';'), $('#short').text(), aid);
				} else {
					Contacts.UI.Card.saveProperty($('#n'));
				}
			},
			loadAddresses:function(){
				$('#addresses').hide();
				$('#addressdisplay dl.propertycontainer').remove();
				var addresscontainer = $('#addressdisplay');
				for(var adr in this.data.ADR) {
					addresscontainer.find('dl').first().clone().insertAfter($('#addressdisplay dl').last()).show();
					addresscontainer.find('dl').last().removeClass('template').addClass('propertycontainer');
					addresscontainer.find('dl').last().data('checksum', this.data.ADR[adr]['checksum']);
					var adrarray = this.data.ADR[adr]['value'];
					var adrtxt = '';
					if(adrarray[0] && adrarray[0].length > 0) {
						adrtxt = adrtxt + '<li>' + adrarray[0].strip_tags() + '</li>';
					}
					if(adrarray[1] && adrarray[1].length > 0) {
						adrtxt = adrtxt + '<li>' + adrarray[1].strip_tags() + '</li>';
					}
					if(adrarray[2] && adrarray[2].length > 0) {
						adrtxt = adrtxt + '<li>' + adrarray[2].strip_tags() + '</li>';
					}
					if((3 in adrarray && 5 in adrarray) && adrarray[3].length > 0 || adrarray[5].length > 0) {
						adrtxt = adrtxt + '<li>' + adrarray[5].strip_tags() + ' ' + adrarray[3].strip_tags() + '</li>';
					}
					if(adrarray[4] && adrarray[4].length > 0) {
						adrtxt = adrtxt + '<li>' + adrarray[4].strip_tags() + '</li>';
					}
					if(adrarray[6] && adrarray[6].length > 0) {
						adrtxt = adrtxt + '<li>' + adrarray[6].strip_tags() + '</li>';
					}
					addresscontainer.find('dl').last().find('.addresslist').html(adrtxt);
					var types = new Array();
					var ttypes = new Array();
					for(var param in this.data.ADR[adr]['parameters']) {
						if(param.toUpperCase() == 'TYPE') {
							types.push(t('contacts', ucwords(this.data.ADR[adr]['parameters'][param].toLowerCase())));
							ttypes.push(this.data.ADR[adr]['parameters'][param]);
						}
					}
					addresscontainer.find('dl').last().find('.adr_type_label').text(types.join('/'));
					addresscontainer.find('dl').last().find('.adr_type').val(ttypes.join(','));
					addresscontainer.find('dl').last().find('.adr').val(adrarray.join(';'));
					addresscontainer.find('dl').last().data('checksum', this.data.ADR[adr]['checksum']);
				}
				if(addresscontainer.find('dl').length > 1) {
					$('#addresses').show();
					$('#contact_communication').show();
				}
				return false;
			},
			editAddress:function(obj, isnew){
				var container = undefined;
				var params = {id: this.id};
				if(obj === 'new') {
					isnew = true;
					$('#addressdisplay dl').first().clone(true).insertAfter($('#addressdisplay dl').last()).show();
					container = $('#addressdisplay dl').last();
					container.removeClass('template').addClass('propertycontainer');
				} else {
					params['checksum'] = Contacts.UI.checksumFor(obj);
				}
				/* Initialize the address edit dialog */
				if($('#edit_address_dialog').dialog('isOpen') == true){
					$('#edit_address_dialog').dialog('moveToTop');
				}else{
					$.getJSON(OC.filePath('contacts', 'ajax', 'editaddress.php'),params,function(jsondata){
						if(jsondata.status == 'success'){
							$('body').append('<div id="address_dialog"></div>');
							$('#address_dialog').html(jsondata.data.page).find('#edit_address_dialog' ).dialog({
								height: 'auto', width: 'auto',
								buttons: {
									'Ok':function() {
										if(isnew) {
											Contacts.UI.Card.saveAddress(this, $('#addressdisplay dl:last-child').find('input').first(), isnew);
										} else {
											Contacts.UI.Card.saveAddress(this, obj, isnew);
										}
										$(this).dialog('close');
									},
									'Cancel':function() {
										$(this).dialog('close');
										if(isnew) {
											container.remove();
										}
									}
								},
								close : function(event, ui) {
									$(this).dialog('destroy').remove();
									$('#address_dialog').remove();
								},
								open : function(event, ui) {
									$( "#adr_city" ).autocomplete({
										source: function( request, response ) {
											$.ajax({
												url: "http://ws.geonames.org/searchJSON",
												dataType: "jsonp",
												data: {
													featureClass: "P",
													style: "full",
													maxRows: 12,
													lang: lang,
													name_startsWith: request.term
												},
												success: function( data ) {
													response( $.map( data.geonames, function( item ) {
														return {
															label: item.name + (item.adminName1 ? ", " + item.adminName1 : "") + ", " + item.countryName,
															value: item.name,
															country: item.countryName
														}
													}));
												}
											});
										},
										minLength: 2,
										select: function( event, ui ) {
											if(ui.item && $('#adr_country').val().trim().length == 0) {
												$('#adr_country').val(ui.item.country);
											}
										},
										open: function() {
											$( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
										},
										close: function() {
											$( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
										}
									});
									$('#adr_country').autocomplete({
										source: function( request, response ) {
											$.ajax({
												url: "http://ws.geonames.org/searchJSON",
												dataType: "jsonp",
												data: {
													/*featureClass: "A",*/
													featureCode: "PCLI",
													/*countryBias: "true",*/
													/*style: "full",*/
													lang: lang,
													maxRows: 12,
													name_startsWith: request.term
												},
												success: function( data ) {
													response( $.map( data.geonames, function( item ) {
														return {
															label: item.name,
															value: item.name
														}
													}));
												}
											});
										},
										minLength: 2,
										select: function( event, ui ) {
											/*if(ui.item) {
												$('#adr_country').val(ui.item.country);
											}
											log( ui.item ?
												"Selected: " + ui.item.label :
												"Nothing selected, input was " + this.value);*/
										},
										open: function() {
											$( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
										},
										close: function() {
											$( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
										}
									});
								}
							});
						} else {
							alert(jsondata.data.message);
						}
					});
				}
			},
			saveAddress:function(dlg, obj, isnew){
				if(isnew) {
					container = $('#addressdisplay dl').last();
					obj = container.find('input').first();
				} else {
					checksum = Contacts.UI.checksumFor(obj);
					container = Contacts.UI.propertyContainerFor(obj);
				}
				var adr = new Array(
					$(dlg).find('#adr_pobox').val().strip_tags(),
					$(dlg).find('#adr_extended').val().strip_tags(),
					$(dlg).find('#adr_street').val().strip_tags(),
					$(dlg).find('#adr_city').val().strip_tags(),
					$(dlg).find('#adr_region').val().strip_tags(),
					$(dlg).find('#adr_zipcode').val().strip_tags(),
					$(dlg).find('#adr_country').val().strip_tags()
				);
				container.find('.adr').val(adr.join(';'));
				container.find('.adr_type').val($(dlg).find('#adr_type').val());
				container.find('.adr_type_label').html(t('contacts',ucwords($(dlg).find('#adr_type').val().toLowerCase())));
				Contacts.UI.Card.saveProperty($(container).find('input').first());
				var adrtxt = '';
				if(adr[0].length > 0) {
					adrtxt = adrtxt + '<li>' + adr[0] + '</li>';
				}
				if(adr[1].length > 0) {
					adrtxt = adrtxt + '<li>' + adr[1] + '</li>';
				}
				if(adr[2].length > 0) {
					adrtxt = adrtxt + '<li>' + adr[2] + '</li>';
				}
				if(adr[3].length > 0 || adr[5].length > 0) {
					adrtxt = adrtxt + '<li>' + adr[5] + ' ' + adr[3] + '</li>';
				}
				if(adr[4].length > 0) {
					adrtxt = adrtxt + '<li>' + adr[4] + '</li>';
				}
				if(adr[6].length > 0) {
					adrtxt = adrtxt + '<li>' + adr[6] + '</li>';
				}
				container.find('.addresslist').html(adrtxt);
			},
			uploadPhoto:function(filelist) {
				if(!filelist) {
					OC.dialogs.alert(t('contacts','No files selected for upload.'), t('contacts', 'Error'));
					return;
				}
				var file = filelist[0];
				var target = $('#file_upload_target');
				var form = $('#file_upload_form');
				var totalSize=0;
				if(file.size > $('#max_upload').val()){
					OC.dialogs.alert(t('contacts','The file you are trying to upload exceed the maximum size for file uploads on this server.'), t('contacts', 'Error'));
					return;
				} else {
					target.load(function(){
						var response=jQuery.parseJSON(target.contents().text());
						if(response != undefined && response.status == 'success'){
							Contacts.UI.Card.editPhoto(response.data.id, response.data.tmp);
							//alert('File: ' + file.tmp + ' ' + file.name + ' ' + file.mime);
						}else{
							OC.dialogs.alert(response.data.message, t('contacts', 'Error'));
						}
					});
					form.submit();
				}
			},
			loadPhotoHandlers:function() {
				var phototools = $('#phototools');
				phototools.find('li a').tipsy('hide');
				phototools.find('li a').tipsy();
				if(this.data.PHOTO) {
					phototools.find('.delete').click(function() {
						$(this).tipsy('hide');
						Contacts.UI.Card.deleteProperty($('#contacts_details_photo'), 'single');
						$(this).hide();
					});
					phototools.find('.edit').click(function() {
						$(this).tipsy('hide');
						Contacts.UI.Card.editCurrentPhoto();
					});
					phototools.find('.delete').show();
					phototools.find('.edit').show();
				} else {
					phototools.find('.delete').hide();
					phototools.find('.edit').hide();
				}
			},
			cloudPhotoSelected:function(path){
				$.getJSON(OC.filePath('contacts', 'ajax', 'oc_photo.php'),{'path':path,'id':Contacts.UI.Card.id},function(jsondata){
					if(jsondata.status == 'success'){
						//alert(jsondata.data.page);
						Contacts.UI.Card.editPhoto(jsondata.data.id, jsondata.data.tmp)
						$('#edit_photo_dialog_img').html(jsondata.data.page);
					}
					else{
						OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
					}
				});
			},
			loadPhoto:function(refresh){
				var self = this;
				var refreshstr = (refresh?'&refresh=1'+Math.random():'')
				$('#phototools li a').tipsy('hide');
				var wrapper = $('#contacts_details_photo_wrapper');
				wrapper.addClass('loading').addClass('wait');
				delete this.photo;
				this.photo = new Image();
				$(this.photo).load(function () {
					$('img.contacts_details_photo').remove()
					$(this).addClass('contacts_details_photo');
					wrapper.removeClass('loading').removeClass('wait');
					$(this).insertAfter($('#phototools')).fadeIn();
				}).error(function () {
					// notify the user that the image could not be loaded
					Contacts.UI.notify({message:t('contacts','Error loading profile picture.')});
				}).attr('src', OC.linkTo('contacts', 'photo.php')+'?id='+self.id+refreshstr);
				this.loadPhotoHandlers()
			},
			editCurrentPhoto:function(){
				$.getJSON(OC.filePath('contacts', 'ajax', 'currentphoto.php'),{'id':this.id},function(jsondata){
					if(jsondata.status == 'success'){
						//alert(jsondata.data.page);
						Contacts.UI.Card.editPhoto(jsondata.data.id, jsondata.data.tmp)
						$('#edit_photo_dialog_img').html(jsondata.data.page);
					}
					else{
						wrapper.removeClass('wait');
						OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
					}
				});
			},
			editPhoto:function(id, tmpkey){
				//alert('editPhoto: ' + tmpkey);
				$.getJSON(OC.filePath('contacts', 'ajax', 'cropphoto.php'),{'tmpkey':tmpkey,'id':this.id, 'requesttoken':requesttoken},function(jsondata){
					if(jsondata.status == 'success'){
						//alert(jsondata.data.page);
						$('#edit_photo_dialog_img').html(jsondata.data.page);
					}
					else{
						OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
					}
				});
				if($('#edit_photo_dialog').dialog('isOpen') == true){
					$('#edit_photo_dialog').dialog('moveToTop');
				} else {
					$('#edit_photo_dialog').dialog('open');
				}
			},
			savePhoto:function(){
				var target = $('#crop_target');
				var form = $('#cropform');
				var wrapper = $('#contacts_details_photo_wrapper');
				var self = this;
				wrapper.addClass('wait');
				form.submit();
				target.load(function(){
					var response=jQuery.parseJSON(target.contents().text());
					if(response != undefined && response.status == 'success'){
						// load cropped photo.
						self.loadPhoto(true);
						Contacts.UI.Card.data.PHOTO = true;
					}else{
						OC.dialogs.alert(response.data.message, t('contacts', 'Error'));
						wrapper.removeClass('wait');
					}
				});
				Contacts.UI.Contacts.refreshThumbnail(this.id);
			},
			addMail:function() {
				//alert('addMail');
				var emaillist = $('#emaillist');
				emaillist.find('li.template:first-child').clone(true).appendTo(emaillist).show().find('a .tip').tipsy();
				emaillist.find('li.template:last-child').find('select').addClass('contacts_property');
				emaillist.find('li.template:last-child').removeClass('template').addClass('propertycontainer');
				emaillist.find('li:last-child').find('input[type="email"]').focus();
				return false;
			},
			loadMails:function() {
				$('#emails').hide();
				$('#emaillist li.propertycontainer').remove();
				for(var mail in this.data.EMAIL) {
					this.addMail();
					//$('#emaillist li:first-child').clone().appendTo($('#emaillist')).show();
					$('#emaillist li:last-child').data('checksum', this.data.EMAIL[mail]['checksum'])
					$('#emaillist li:last-child').find('input[type="email"]').val(this.data.EMAIL[mail]['value']);
					for(var param in this.data.EMAIL[mail]['parameters']) {
						if(param.toUpperCase() == 'PREF') {
							$('#emaillist li:last-child').find('input[type="checkbox"]').attr('checked', 'checked')
						}
						else if(param.toUpperCase() == 'TYPE') {
							for(etype in this.data.EMAIL[mail]['parameters'][param]) {
								var et = this.data.EMAIL[mail]['parameters'][param][etype];
								$('#emaillist li:last-child').find('select option').each(function(){
									if($.inArray($(this).val().toUpperCase(), et.toUpperCase().split(',')) > -1) {
										$(this).attr('selected', 'selected');
									}
								});
							}
						}
					}
				}
				if($('#emaillist li').length > 1) {
					$('#emails').show();
					$('#contact_communication').show();
				}

				$('#emaillist li:last-child').find('input[type="text"]').focus();
				return false;
			},
			addPhone:function() {
				var phonelist = $('#phonelist');
				phonelist.find('li.template:first-child').clone(true).appendTo(phonelist); //.show();
				phonelist.find('li.template:last-child').find('select').addClass('contacts_property');
				phonelist.find('li.template:last-child').removeClass('template').addClass('propertycontainer');
				phonelist.find('li:last-child').find('input[type="text"]').focus();
				phonelist.find('li:last-child').find('select').multiselect({
														noneSelectedText: t('contacts', 'Select type'),
														header: false,
														selectedList: 4,
														classes: 'typelist'
													});
				phonelist.find('li:last-child').show();
				return false;
			},
			loadPhones:function() {
				$('#phones').hide();
				$('#phonelist li.propertycontainer').remove();
				var phonelist = $('#phonelist');
				for(var phone in this.data.TEL) {
					this.addPhone();
					phonelist.find('li:last-child').find('select').multiselect('destroy');
					phonelist.find('li:last-child').data('checksum', this.data.TEL[phone]['checksum'])
					phonelist.find('li:last-child').find('input[type="text"]').val(this.data.TEL[phone]['value']);
					for(var param in this.data.TEL[phone]['parameters']) {
						if(param.toUpperCase() == 'PREF') {
							phonelist.find('li:last-child').find('input[type="checkbox"]').attr('checked', 'checked');
						}
						else if(param.toUpperCase() == 'TYPE') {
							for(ptype in this.data.TEL[phone]['parameters'][param]) {
								var pt = this.data.TEL[phone]['parameters'][param][ptype];
								phonelist.find('li:last-child').find('select option').each(function(){
									//if ($(this).val().toUpperCase() == pt.toUpperCase()) {
									if ($.inArray($(this).val().toUpperCase(), pt.toUpperCase().split(',')) > -1) {
										$(this).attr('selected', 'selected');
									}
								});
							}
						}
					}
					phonelist.find('li:last-child').find('select').multiselect({
											noneSelectedText: t('contacts', 'Select type'),
											header: false,
											selectedList: 4,
											classes: 'typelist'
										});
				}
				if(phonelist.find('li').length > 1) {
					$('#phones').show();
					$('#contact_communication').show();
				}
				return false;
			},
		},
		Addressbooks:{
			overview:function(){
				if($('#chooseaddressbook_dialog').dialog('isOpen') == true){
					$('#chooseaddressbook_dialog').dialog('moveToTop');
				}else{
					$('body').append('<div id="addressbook_dialog"></div>');
					$.getJSON(OC.filePath('contacts', 'ajax', 'chooseaddressbook.php'), function(jsondata){
						if(jsondata.status == 'success'){
							$('#addressbook_dialog').html(jsondata.data.page).find('#chooseaddressbook_dialog').dialog({
								minWidth : 600,
								close : function(event, ui) {
									$(this).dialog('destroy').remove();
									$('#addressbook_dialog').remove();
								}
							}).css('overflow','visible');
						} else {
							alert(jsondata.data.message);
							$('#addressbook_dialog').remove();
						}
					});
				}
				return false;
			},
			activation:function(checkbox, bookid){
				var active = checkbox.checked;
				$.post(OC.filePath('contacts', 'ajax', 'activation.php'), {bookid: bookid, active: (active?1:0)}, function(jsondata) {
					if (jsondata.status == 'success'){
						if(!active) {
							$('#contacts h3[data-id="'+bookid+'"],#contacts ul[data-id="'+bookid+'"]').remove();
						} else {
							Contacts.UI.Contacts.update();
						}
					} else {
						OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
						checkbox.checked = !active;
					}
				  });
			},
			addAddressbook:function(name, description, cb) {
				$.post(OC.filePath('contacts', 'ajax', 'addaddressbook.php'), { name: name, description: description, active: true },
					function(jsondata){
						if(jsondata.status == 'success'){
							if(cb) {
								cb(jsondata.data);
							}
						} else {
							OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
							return false;
						}
				});

			},
			newAddressbook:function(object){
				var tr = $(document.createElement('tr'))
					.load(OC.filePath('contacts', 'ajax', 'addbook.php'));
				$(object).closest('tr').after(tr).hide();
			},
			editAddressbook:function(object, bookid){
				var tr = $(document.createElement('tr'))
					.load(OC.filePath('contacts', 'ajax', 'editaddressbook.php') + "?bookid="+bookid);
				$(object).closest('tr').after(tr).hide();
			},
			deleteAddressbook:function(obj, bookid){
				var check = confirm("Do you really want to delete this address book?");
				if(check == false){
					return false;
				}else{
					$.post(OC.filePath('contacts', 'ajax', 'deletebook.php'), { id: bookid},
					  function(jsondata) {
						if (jsondata.status == 'success'){
							$(obj).closest('tr').remove();
							$('#contacts h3[data-id="'+bookid+'"],#contacts ul[data-id="'+bookid+'"]').remove();
							Contacts.UI.Contacts.update();
						} else {
							OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
						}
					  });
				}
			},
			doImport:function(file, aid){
				$.post(OC.filePath('contacts', '', 'import.php'), { id: aid, file: file, fstype: 'OC_FilesystemView' },
					function(jsondata){
						if(jsondata.status != 'success'){
							Contacts.UI.notify({message:jsondata.data.message});
						}
				});
				return false;
			},
			submit:function(button, bookid){
				var displayname = $("#displayname_"+bookid).val().trim();
				var active = $("#edit_active_"+bookid+":checked").length;
				var description = $("#description_"+bookid).val();

				if(displayname.length == 0) {
					OC.dialogs.alert(t('contacts', 'Displayname cannot be empty.'), t('contacts', 'Error'));
					return false;
				}
				var url;
				if (bookid == 'new'){
					url = OC.filePath('contacts', 'ajax', 'createaddressbook.php');
				}else{
					url = OC.filePath('contacts', 'ajax', 'updateaddressbook.php');
				}
				$.post(url, { id: bookid, name: displayname, active: active, description: description },
					function(jsondata){
						if(jsondata.status == 'success'){
							$(button).closest('tr').prev().html(jsondata.page).show().next().remove();
							Contacts.UI.Contacts.update();
						} else {
							OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
						}
				});
			},
			cancel:function(button, bookid){
				$(button).closest('tr').prev().show().next().remove();
			}
		},
		Contacts:{
			contacts:{},
			deletionQueue:[],
			batchnum:50,
			warnNotDeleted:function(e) {
				e = e || window.event;
				var warn = t('contacts', 'Some contacts are marked for deletion, but not deleted yet. Please wait for them to be deleted.');
				if (e) {
					e.returnValue = String(warn);
				}
				if(Contacts.UI.Contacts.deletionQueue.length > 0) {
					setTimeout(Contacts.UI.Contacts.deleteFilesInQueue, 1);
				}
				return warn;
			},
			deleteFilesInQueue:function() {
				var queue = Contacts.UI.Contacts.deletionQueue;
				if(queue.length > 0) {
					Contacts.UI.notify({cancel:true});
					while(queue.length > 0) {
						var id = queue.pop();
						if(id) {
							Contacts.UI.Card.doDelete(id, false);
						}
					}
				}
			},
			getContact:function(id) {
				if(!this.contacts[id]) {
					this.contacts[id] = $('#contacts li[data-id="'+id+'"]');
						if(!this.contacts[id]) {
							self = this;
							$.getJSON(OC.filePath('contacts', 'ajax', 'contactdetails.php'),{'id':id},function(jsondata){
								if(jsondata.status == 'success'){
									self.contacts[id] = self.insertContact({data:jsondata.data});
								}
								else{
									OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
								}
							});
						}
				}
				return this.contacts[id];
			},
			drop:function(event, ui) {
				var dragitem = ui.draggable, droptarget = $(this);
				if(dragitem.is('li')) {
					Contacts.UI.Contacts.dropContact(event, dragitem, droptarget);
				} else {
					Contacts.UI.Contacts.dropAddressbook(event, dragitem, droptarget);
				}
			},
			dropContact:function(event, dragitem, droptarget) {
				if(dragitem.data('bookid') == droptarget.data('id')) {
					return false;
				}
				var droplist = (droptarget.is('ul'))?droptarget:droptarget.next();
				$.post(OC.filePath('contacts', 'ajax', 'movetoaddressbook.php'), { ids: dragitem.data('id'), aid: droptarget.data('id') },
					function(jsondata){
						if(jsondata.status == 'success'){
							dragitem.attr('data-bookid', droptarget.data('id'))
							dragitem.data('bookid', droptarget.data('id'));
							Contacts.UI.Contacts.insertContact({
								contactlist:droplist,
								contact:dragitem.detach()
							});
							Contacts.UI.Contacts.scrollTo(dragitem.data('id'));
						} else {
							OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
						}
				});
			},
			dropAddressbook:function(event, dragitem, droptarget) {
				alert('Dropping address books not implemented yet');
			},
			/**
			 * @params params An object with the properties 'contactlist':a jquery object of the ul to insert into,
			 * 'contacts':a jquery object of all items in the list and either 'data': an object with the properties
			 * id, addressbookid and displayname or 'contact': a listitem to be inserted directly.
			 * If 'contactlist' or 'contacts' aren't defined they will be search for based in the properties in 'data'.
			 */
			insertContact:function(params) {
				var id, bookid;
				if(!params.contactlist) {
					// FIXME: Check if contact really exists.
					bookid = params.data ? params.data.addressbookid : params.contact.data('bookid');
					id = params.data ? params.data.id : params.contact.data('id');
					params.contactlist = $('#contacts ul[data-id="'+bookid+'"]');
				}
				if(!params.contacts) {
					bookid = params.data ? params.data.addressbookid : params.contact.data('bookid');
					id = params.data ? params.data.id : params.contact.data('id');
					params.contacts = $('#contacts ul[data-id="'+bookid+'"] li');
				}
				var contact = params.data
					? $('<li data-id="'+params.data.id+'" data-bookid="'+params.data.addressbookid+'" role="button"><a href="'+OC.linkTo('contacts', 'index.php')+'&id='+params.data.id+'"  style="background: url('+OC.filePath('contacts', '', 'thumbnail.php')+'?id='+params.data.id+') no-repeat scroll 0% 0% transparent;">'+params.data.displayname+'</a></li>')
					: params.contact;
				var added = false;
				var name = params.data ? params.data.displayname.toLowerCase() : contact.find('a').text().toLowerCase();
				if(params.contacts) {
					params.contacts.each(function() {
						if ($(this).text().toLowerCase() > name) {
							$(this).before(contact);
							added = true;
							return false;
						}
					});
				}
				if(!added || !params.contacts) {
					params.contactlist.append(contact);
				}
				//this.contacts[id] = contact;
				return contact;
			},
			next:function(reverse) {
				// TODO: Check if we're last-child/first-child and jump to next/prev address book.
				var curlistitem = $('#contacts li[data-id="'+Contacts.UI.Card.id+'"]');
				var newlistitem = reverse ? curlistitem.prev('li') : curlistitem.next('li');
				if(newlistitem) {
					curlistitem.removeClass('active');
					Contacts.UI.Card.update({
						cid:newlistitem.data('id'),
						aid:newlistitem.data('bookid')
					});
				}
			},
			previous:function() {
				this.next(true);
			},
			// Reload the contacts list.
			update:function(params){
				if(!params) { params = {}; }
				if(!params.start) {
					if(params.aid) {
						$('#contacts h3[data-id="'+params.aid+'"],#contacts ul[data-id="'+params.aid+'"]').remove();
					} else {
						$('#contacts').empty();
					}
				}
				self = this;
				console.log('update: ' + params.cid + ' ' + params.aid + ' ' + params.start);
				var firstrun = false;
				var opts = {};
				opts['startat'] = (params.start?params.start:0);
				if(params.aid) {
					opts['aid'] = params.aid;
				}
				$.getJSON(OC.filePath('contacts', 'ajax', 'contacts.php'),opts,function(jsondata){
					if(jsondata.status == 'success'){
						var books = jsondata.data.entries;
						$.each(books, function(b, book) {
							if($('#contacts h3[data-id="'+b+'"]').length == 0) {
								firstrun = true;
								if($('#contacts h3').length == 0) {
									$('#contacts').html('<h3 class="addressbook" contextmenu="addressbookmenu" data-id="'+b+'">'+book.displayname+'</h3><ul class="contacts hidden" data-id="'+b+'"></ul>');
								} else {
									if(!$('#contacts h3[data-id="'+b+'"]').length) {
										var item = $('<h3 class="addressbook" contextmenu="addressbookmenu" data-id="'+b+'">'+book.displayname+'</h3><ul class="contacts hidden" data-id="'+b+'"></ul>')
										var added = false;
										$('#contacts h3').each(function(){
											if ($(this).text().toLowerCase() > book.displayname.toLowerCase()) {
												$(this).before(item).fadeIn('fast');
												added = true;
												return false;
											}
										});
										if(!added) {
											$('#contacts').append(item);
										}

									}
								}
								$('#contacts h3[data-id="'+b+'"]').on('click', function(event) {
									$('#contacts h3').removeClass('active');
									$(this).addClass('active');
									$('#contacts ul[data-id="'+b+'"]').slideToggle(300);
									return false;
								});
								var accept = 'li:not([data-bookid="'+b+'"]),h3:not([data-id="'+b+'"])';
								$('#contacts h3[data-id="'+b+'"],#contacts ul[data-id="'+b+'"]').droppable({
									drop: Contacts.UI.Contacts.drop,
									activeClass: 'ui-state-hover',
									accept: accept
								});
							}
							var contactlist = $('#contacts ul[data-id="'+b+'"]');
							var contacts = $('#contacts ul[data-id="'+b+'"] li');
							for(var c in book.contacts) {
								if(book.contacts[c].id == undefined) { continue; }
								if(!$('#contacts li[data-id="'+book.contacts[c]['id']+'"]').length) {
									var contact = Contacts.UI.Contacts.insertContact({contactlist:contactlist, contacts:contacts, data:book.contacts[c]});
									if(c == self.batchnum-10) {
										contact.bind('inview', function(event, isInView, visiblePartX, visiblePartY) {
											$(this).unbind(event);
											var bookid = $(this).data('bookid');
											var numsiblings = $('.contacts li[data-bookid="'+bookid+'"]').length;
											if (isInView && numsiblings >= self.batchnum) {
												console.log('This would be a good time to load more contacts.');
												Contacts.UI.Contacts.update({cid:params.cid, aid:bookid, start:$('#contacts li[data-bookid="'+bookid+'"]').length});
											}
										});
									}
								}
							}
						});
						if($('#contacts h3').length > 1) {
							$('#contacts li,#contacts h3').draggable({
								distance: 10,
								revert: 'invalid',
								axis: 'y', containment: '#contacts',
								scroll: true, scrollSensitivity: 40,
								opacity: 0.7, helper: 'clone'
							});
						} else {
							$('#contacts h3').first().addClass('active');
						}
						if(opts['startat'] == 0) { // only update card on first load.
							Contacts.UI.Card.update(params);
						}
					}
					else{
						OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
					}
				});
			},
			refreshThumbnail:function(id){
				var item = $('.contacts li[data-id="'+id+'"]').find('a');
				item.html(Contacts.UI.Card.fn);
				item.css('background','url('+OC.filePath('contacts', '', 'thumbnail.php')+'?id='+id+'&refresh=1'+Math.random()+') no-repeat');
			},
			scrollTo:function(id){
				var item = $('#contacts li[data-id="'+id+'"]');
				if(item && $.isNumeric(item.offset().top)) {
					console.log('scrollTo ' + parseInt(item.offset().top));
					$('#contacts').animate({
						scrollTop: parseInt(item.offset()).top-40}, 'slow','swing');
				}
			}
		}
	}
}
$(document).ready(function(){

	OCCategories.changed = Contacts.UI.Card.categoriesChanged;
	OCCategories.app = 'contacts';

	$('#chooseaddressbook').on('click keydown', Contacts.UI.Addressbooks.overview);
	$('#contacts_newcontact').on('click keydown', Contacts.UI.Card.editNew);

	var ninjahelp = $('#ninjahelp');

	ninjahelp.find('.close').on('click keydown',function() {
		ninjahelp.hide();
	});

	$(document).on('keyup', function(event) {
		console.log(event.which + ' ' + event.target.nodeName);
		if(event.target.nodeName.toUpperCase() != 'BODY'
			|| $('#contacts li').length == 0
			|| !Contacts.UI.Card.id) {
			return;
		}
		/**
		 * To add:
		 * (Shift)n/p: next/prev addressbook
		 * u (85): hide/show leftcontent
		 * f (70): add field
		 */
		switch(event.which) {
			case 27: // Esc
				ninjahelp.hide();
				break;
			case 46:
				if(event.shiftKey) {
					Contacts.UI.Card.delayedDelete();
				}
				break;
			case 32: // space
				if(event.shiftKey) {
					Contacts.UI.Contacts.previous();
					break;
				}
			case 40: // down
			case 75: // k
				Contacts.UI.Contacts.next();
				break;
			case 65: // a
				if(event.shiftKey) {
					// add addressbook
					Contacts.UI.notImplemented();
					break;
				}
				Contacts.UI.Card.editNew();
				break;
			case 38: // up
			case 74: // j
				Contacts.UI.Contacts.previous();
				break;
			case 78: // n
				// next addressbook
				Contacts.UI.notImplemented();
				break;
			case 13: // Enter
			case 79: // o
				var aid = $('#contacts h3.active').first().data('id');
				if(aid) {
					$('#contacts ul[data-id="'+aid+'"]').slideToggle(300);
				}
				break;
			case 80: // p
				// prev addressbook
				Contacts.UI.notImplemented();
				break;
			case 82: // r
				Contacts.UI.Contacts.update({cid:Contacts.UI.Card.id});
				break;
			case 191: // ?
				ninjahelp.toggle('fast');
				break;
		}

	});

	//$(window).on('beforeunload', Contacts.UI.Contacts.deleteFilesInQueue);

	// Load a contact.
	$('.contacts').keydown(function(event) {
		if(event.which == 13 || event.which == 32) {
			$('.contacts').click();
		}
	});
	$(document).on('click', '#contacts', function(event){
		var $tgt = $(event.target);
		if ($tgt.is('li') || $tgt.is('a')) {
			var item = $tgt.is('li')?$($tgt):($tgt).parent();
			var id = item.data('id');
			var bookid = item.data('bookid');
			item.addClass('active');
			var oldid = $('#rightcontent').data('id');
			if(oldid != 0){
				var olditem = $('.contacts li[data-id="'+oldid+'"]');
				var oldbookid = olditem.data('bookid');
				olditem.removeClass('active');
				if(oldbookid != bookid) {
					$('#contacts h3[data-id="'+oldbookid+'"]').removeClass('active');
					$('#contacts h3[data-id="'+bookid+'"]').addClass('active');
				}
			}
			$.getJSON(OC.filePath('contacts', 'ajax', 'contactdetails.php'),{'id':id},function(jsondata){
				if(jsondata.status == 'success'){
					Contacts.UI.Card.loadContact(jsondata.data, bookid);
				}
				else{
					OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
				}
			});
		}
		return false;
	});

	$('.contacts_property').live('change', function(){
		Contacts.UI.Card.saveProperty(this);
	});

	$(function() {
		// Upload function for dropped contact photos files. Should go in the Contacts class/object.
		$.fileUpload = function(files){
			var file = files[0];
			if(file.size > $('#max_upload').val()){
				OC.dialogs.alert(t('contacts','The file you are trying to upload exceed the maximum size for file uploads on this server.'), t('contacts','Upload too large'));
				return;
			}
			if (file.type.indexOf("image") != 0) {
				OC.dialogs.alert(t('contacts','Only image files can be used as profile picture.'), t('contacts','Wrong file type'));
				return;
			}
			var xhr = new XMLHttpRequest();

			if (!xhr.upload) {
				OC.dialogs.alert(t('contacts', 'Your browser doesn\'t support AJAX upload. Please click on the profile picture to select a photo to upload.'), t('contacts', 'Error'))
			}
			fileUpload = xhr.upload,
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4){
					response = $.parseJSON(xhr.responseText);
					if(response.status == 'success') {
						if(xhr.status == 200) {
							Contacts.UI.Card.editPhoto(response.data.id, response.data.tmp);
						} else {
							OC.dialogs.alert(xhr.status + ': ' + xhr.responseText, t('contacts', 'Error'));
						}
					} else {
						OC.dialogs.alert(response.data.message, t('contacts', 'Error'));
					}
				}
			};

			fileUpload.onprogress = function(e){
				if (e.lengthComputable){
					var _progress = Math.round((e.loaded * 100) / e.total);
					//if (_progress != 100){
					//}
				}
			};
			xhr.open('POST', OC.filePath('contacts', 'ajax', 'uploadphoto.php')+'?id='+Contacts.UI.Card.id+'&requesttoken='+requesttoken+'&imagefile='+encodeURIComponent(file.name), true);
			xhr.setRequestHeader('Cache-Control', 'no-cache');
			xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
			xhr.setRequestHeader('X_FILE_NAME', encodeURIComponent(file.name));
			xhr.setRequestHeader('X-File-Size', file.size);
			xhr.setRequestHeader('Content-Type', file.type);
			xhr.send(file);
		}
	});

	$(document).bind('drop dragover', function (e) {
			e.preventDefault(); // prevent browser from doing anything, if file isn't dropped in dropZone
	});

	//add multiply file upload attribute to all browsers except konqueror (which crashes when it's used)
	if(navigator.userAgent.search(/konqueror/i)==-1){
		$('#import_upload_start').attr('multiple','multiple')
	}
	// Import using jquery.fileupload
	$(function() {
		var uploadingFiles = {}, numfiles = 0, uploadedfiles = 0, retries = 0;
		var aid;

		$('#import_upload_start').fileupload({
			dropZone: $('#contacts'), // restrict dropZone to contacts list.
			acceptFileTypes:  /^text\/(directory|vcard|x-vcard)$/i,
			add: function(e, data) {
				var files = data.files;
				var totalSize=0;
				if(files) {
					numfiles += files.length; uploadedfiles = 0;
					for(var i=0;i<files.length;i++) {
						if(files[i].size ==0 && files[i].type== '') {
							OC.dialogs.alert(t('files', 'Unable to upload your file as it is a directory or has 0 bytes'), t('files', 'Upload Error'));
							return;
						}
						totalSize+=files[i].size;
					}
				}
				if(totalSize>$('#max_upload').val()){
					OC.dialogs.alert(t('contacts','The file you are trying to upload exceed the maximum size for file uploads on this server.'), t('contacts','Upload too large'));
					numfiles = uploadedfiles = retries = aid = 0;
					uploadingFiles = {};
					return;
				}else{
					if($.support.xhrFileUpload) {
						for(var i=0;i<files.length;i++){
							var fileName = files[i].name;
							var dropTarget;
							if($(e.originalEvent.target).is('h3')) {
								dropTarget = $(e.originalEvent.target).next('ul');
							} else {
								dropTarget = $(e.originalEvent.target).closest('ul');
							}
							if(dropTarget && dropTarget.hasClass('contacts')) { // TODO: More thorough check for where we are.
								aid = dropTarget.attr('data-id');
							} else {
								aid = undefined;
							}
							var jqXHR =  $('#import_upload_start').fileupload('send', {files: files[i],
								formData: function(form) {
									var formArray = form.serializeArray();
									formArray['aid'] = aid;
									return formArray;
								}})
								.success(function(result, textStatus, jqXHR) {
									if(result.status == 'success') {
										// import the file
										uploadedfiles += 1;
									} else {
										Contacts.UI.notify({message:jsondata.data.message});
									}
									return false;
								})
								.error(function(jqXHR, textStatus, errorThrown) {
									console.log(textStatus);
									Contacts.UI.notify({message:errorThrown + ': ' + textStatus,});
								});
							uploadingFiles[fileName] = jqXHR;
						}
					} else {
						data.submit().success(function(data, status) {
							response = jQuery.parseJSON(data[0].body.innerText);
							if(response[0] != undefined && response[0].status == 'success') {
								var file=response[0];
								delete uploadingFiles[file.name];
								$('tr').filterAttr('data-file',file.name).data('mime',file.mime);
								var size = $('tr').filterAttr('data-file',file.name).find('td.filesize').text();
								if(size==t('files','Pending')){
									$('tr').filterAttr('data-file',file.name).find('td.filesize').text(file.size);
								}
								FileList.loadingDone(file.name);
							} else {
								Contacts.UI.notify({message:response.data.message});
							}
						});
					}
				}
			},
			fail: function(e, data) {
				console.log('fail');
				Contacts.UI.notify({message:data.errorThrown + ': ' + data.textStatus});
				// TODO: Remove file from upload queue.
			},
			progressall: function(e, data) {
				var progress = (data.loaded/data.total)*50;
				$('#uploadprogressbar').progressbar('value',progress);
			},
			start: function(e, data) {
				$('#uploadprogressbar').progressbar({value:0});
				$('#uploadprogressbar').fadeIn();
				if(data.dataType != 'iframe ') {
					$('#upload input.stop').show();
				}
			},
			stop: function(e, data) {
				// stop only gets fired once so we collect uploaded items here.
				var importFiles = function(aid, fileList) {
					// Create a closure that can be called from different places.
					if(numfiles != uploadedfiles) {
						Contacts.UI.notify({message:t('contacts', 'Not all files uploaded. Retrying...')});
						retries += 1;
						if(retries > 3) {
							numfiles = uploadedfiles = retries = aid = 0;
							uploadingFiles = {};
							$('#uploadprogressbar').fadeOut();
							OC.dialogs.alert(t('contacts', 'Something went wrong with the upload, please retry.'), t('contacts', 'Error'));
							return;
						}
						setTimeout(function() { // Just to let any uploads finish
							importFiles(aid, uploadingFiles);
						}, 1000);
					}
					$('#uploadprogressbar').progressbar('value',50);
					var todo = uploadedfiles;
					$.each(fileList, function(fileName, data) {
						Contacts.UI.Addressbooks.doImport(fileName, aid);
						delete fileList[fileName];
						numfiles -= 1; uploadedfiles -= 1;
						$('#uploadprogressbar').progressbar('value',50+(50/(todo-uploadedfiles)));
					})
					$('#uploadprogressbar').progressbar('value',100);
					$('#uploadprogressbar').fadeOut();
					setTimeout(function() {
						Contacts.UI.Contacts.update({aid:aid});
						numfiles = uploadedfiles = retries = aid = 0;
					}, 1000);
				}
				if(!aid) {
					// Either selected with filepicker or dropped outside of an address book.
					$.getJSON(OC.filePath('contacts', 'ajax', 'selectaddressbook.php'),{},function(jsondata) {
						if(jsondata.status == 'success') {
							if($('#selectaddressbook_dialog').dialog('isOpen') == true) {
								$('#selectaddressbook_dialog').dialog('moveToTop');
							} else {
								$('#dialog_holder').html(jsondata.data.page).ready(function($) {
									var select_dlg = $('#selectaddressbook_dialog');
									select_dlg.dialog({
										modal: true, height: 'auto', width: 'auto',
										buttons: {
											'Ok':function() {
												aid = select_dlg.find('input:checked').val();
												if(aid == 'new') {
													var displayname = select_dlg.find('input.name').val();
													var description = select_dlg.find('input.desc').val();
													if(!displayname.trim()) {
														OC.dialogs.alert(t('contacts', 'The address book name cannot be empty.'), t('contacts', 'Error'));
														return false;
													}
													$(this).dialog('close');
													Contacts.UI.Addressbooks.addAddressbook(displayname, description, function(addressbook){
														aid = addressbook.id;
														setTimeout(function() {
															importFiles(aid, uploadingFiles);
														}, 500);
														console.log('aid ' + aid);
													});
												} else {
													setTimeout(function() {
														importFiles(aid, uploadingFiles);
													}, 500);
													console.log('aid ' + aid);
													$(this).dialog('close');
												}
											},
											'Cancel':function() {
												$(this).dialog('close');
												numfiles = uploadedfiles = retries = aid = 0;
												uploadingFiles = {};
												$('#uploadprogressbar').fadeOut();
											}
										},
										close: function(event, ui) {
											// TODO: If numfiles != 0 delete tmp files after a timeout.
											$(this).dialog('destroy').remove();
										}
									});
								});
							}
						} else {
							$('#uploadprogressbar').fadeOut();
							OC.dialogs.alert(jsondata.data.message, t('contacts', 'Error'));
						}
					});
				} else {
					// Dropped on an address book or it's list.
					setTimeout(function() { // Just to let any uploads finish
						importFiles(aid, uploadingFiles);
					}, 1000);
				}
				if(data.dataType != 'iframe ') {
					$('#upload input.stop').hide();
				}
			}
		})
	});

	Contacts.UI.loadHandlers();
	Contacts.UI.Contacts.update({cid:id});
});
