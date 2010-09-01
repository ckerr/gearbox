/**
 * Gearbox: a Web GUI for Transmission
 * 
 * Copyright (c) Mnemosyne LLC
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 */

Transmission.OpenDialog = Ext.extend( Ext.Window,
{
    mySession: null,
    myPrefs: null,
    myFormPanel: null,

    onOpenClicked: function( )
    {
        var d = this;
        var fp = myFormPanel;

        fp.getForm().submit({
            url: '/transmission/upload',
            standardSubmit: true,
            method: 'POST',
            waitMsg: 'Uploading torrent...',
            success: function( form, action ) { mySession.updateTorrents( ); d.close(); }
        });
    },

    constructor: function( config )
    {
        var d = this;
        mySesion = config.session;

        myFormPanel = new Ext.form.FormPanel( {
            bodyCssClass: 'hig-body',
            fileUpload: true,
            bodyStyle: 'padding: 10px 10px 0 10px;',
            width: 400,
            defaults: {
                anchor: '95%',
                allowBlank: true,
                msgTarget: 'side'
            },
            items: [
                { xtype: 'hidden', name: 'X-Transmission-Session-Id', value: config.session.getSessionId() },
                { xtype: 'fieldset', title: 'Source', cls: 'hig-fieldset', items: [
                    { xtype: 'fileuploadfield', fieldLabel: 'File', emptyText: 'Local .torrent file',
                        buttonText: 'Browse...', id: 'open-dialog-file-field' },
                     { xtype: 'textfield', fieldLabel: 'URL', id: 'open-dialog-url-field', emptyText: 'URL' }
                ] },
                { xtype: 'fieldset', title: 'Options', cls: 'hig-fieldset', items: [
                    { xtype: 'checkbox', hideLabel: true, boxLabel: 'Start when added' }
                ] }
            ],
            buttons: [
                { text: 'Cancel', handler: d.close, scope: d },
                { text: 'Open', handler: d.onOpenClicked, scope: d }
            ]
        });
        config = Ext.apply( {
            title: 'Open File or URL',
            autoHeight: true,
            items: [ myFormPanel ],
            }, config );
        Transmission.OpenDialog.superclass.constructor.call( this, config );
        mySession = config.session;
        myPrefs = config.prefs;
    }
});
