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

Ext.namespace( 'Transmission' );

TrackerView = Ext.extend( Ext.Container,
{
    store: null,
    prefs: null,
    session: null,
    showBackups: false,
    showScrapes: false,
    torrentId: -1,
    addButton: null,
    editButton: null,
    removeButton: null,
    gridPanel: null,

    TRACKER_INACTIVE: 0,
    TRACKER_WAITING: 1,
    TRACKER_QUEUED: 2,
    TRACKER_ACTIVE: 3,

    /***
    ****
    ***/

    timeToStringRounded: function( seconds )
    {
        if( seconds > 60 )
            seconds -= ( seconds % 60 );
        return Transmission.fmt.timeInterval( seconds );
    },

    renderTracker: function( value, metadata, record, rowIndex, colIndex, store )
    {
        var key;
        var str;
        var d = record.data;
        var strings = [ ];
        var now = new Date().getTime() / 1000;
        var err_markup_begin = '<span style="color:red">';
        var err_markup_end = '</span>';
        var timeout_markup_begin = '<span style="color:#224466">';
        var timeout_markup_end = '</span>';
        var success_markup_begin = '<span style="color:#008B00">';
        var success_markup_end = '</span>';

        strings.push( '<div style="display:table; margin: 2px;">');

        strings.push( '<img style="display:table-cell; margin-left: 4px; margin-right: 8px;" src="http://', record.data.host, '/favicon.ico" width="16" height="16"/>' );
        // hostname
        //
        strings.push( '<div style="display:table-cell"/>' );
        strings.push( record.data.isBackup ? '<i>' : '<b>' );
        strings.push( record.data.uri.host, ':', record.data.uri.port );
        strings.push( record.data.isBackup ? '</i>' : '</b>' );

        // announce & scrape info
        if( !d.isBackup )
        {
            if( d.hasAnnounced )
            {
                var tstr =  this.timeToStringRounded( now - d.lastAnnounceTime );
                strings.push( '<br/>' );
                if( d.lastAnnounceSucceeded )
                {
                    strings.push( 'Got a list of ',
                                  success_markup_begin, Ext.util.Format.plural( d.lastAnnouncePeerCount, 'peer' ), success_markup_end,
                                  ' ', tstr, ' ago' );
                }
                else if( d.lastAnnounceTimedOut )
                {
                    strings.push( 'Peer list request ',
                                  timeout_markup_begin, 'timed out', timeout_markup_end,
                                  ' ', tstr, ' ago; will retry' );
                }
                else
                {
                    strings.push( 'Got an error ',
                                  err_markup_begin, '"', d.lastAnnounceResult, '"', err_markup_end,
                                  ' ', tstr, ' ago' );
                }
            }

            switch( d.announceState )
            {
                case this.TRACKER_INACTIVE:
                    if( !d.hasAnnounced )
                        strings.push( '<br/>', 'No updates scheduled' );
                    break;

                case this.TRACKER_WAITING:
                    strings.push( '<br/>', 'Asking for more peers in ', this.timeToStringRounded( d.nextAnnounceTime - now ) );;
                    break;

                case this.TRACKER_QUEUED:
                    strings.push( '<br/>', 'Queued to ask for more peers' );
                    break;

                case this.TRACKER_ACTIVE:
                    strings.push( '<br/>', 'Asking for more peers now...',
                                  '<small>', this.timeToStringRounded( now - d.lastAnnounceStartTime ), '</small>' );
                    break;
            }

            if( this.showScrapes )
            {
                if( d.hasScraped )
                {
                    strings.push( '<br/>' );
                    var tstr = this.timeToStringRounded( now - d.lastScrapeTime );

                    if( d.lastScrapeSucceeded )
                    {
                        strings.push( 'Tracker had ',
                                      success_markup_begin, Ext.util.Format.plural( d.seederCount, 'seeder' ), success_markup_end,
                                      ' and ',
                                      success_markup_begin, Ext.util.Format.plural( d.leecherCount, 'leecher' ), success_markup_end,
                                      ' ', tstr, ' ago' );
                    }
                    else
                    {
                        strings.push( 'Got a scrape error ',
                                      err_markup_begin, '"', d.lastScrapeResult, '"', err_markup_end,
                                      ' ', tstr, ' ago' );
                    }
                }

                switch( d.scrapeState )
                {
                    case this.TRACKER_INACTIVE:
                        break;

                    case this.TRACKER_WAITING:
                        strings.push( '<br/>', 'Asking for peer counts in ', this.timeToStringRounded( d.nextScrapeTime - now ) );
                        break;

                    case this.TRACKER_QUEUED:
                        strings.push( '<br/>', 'Queued to ask for peer counts' );
                        break;

                    case this.TRACKER_ACTIVE:
                        strings.push( '<br/>', 'Asking for peer counts now... ',
                                      '<small>', this.timeToStringRounded( now - d.lastScrapeStartTime ), '</small>' );
                        break;
                }
            }
        }

        strings.push( '</div>' ); // layout: table cell
        strings.push( '</div>' ); // layout: table
        return strings.join('');
    },

    refresh: function( record )
    {
        if( record.getId() !== this.torrentId )
            return;

        // FIXME: use reload() instead?
        this.store.removeAll( );
        this.store.loadData( record.data );
    },

    onShowBackupsChecked: function( checkbox, isChecked )
    {
        this.prefs.set({ 'show-backup-trackers': isChecked });
    },

    onShowScrapesChecked: function( checkbox, isChecked )
    {
        this.prefs.set({ 'show-tracker-scrapes': isChecked });
    },

    onPrefsChanged: function( keys )
    {
        for( var i=keys.length; i--; )
        {
            var key = keys[i];

            if( key == 'show-backup-trackers' )
            {
                var b = this.prefs.getBool( key );
                Ext.getCmp(key).setValue( b );
                this.showBackups = b;

                this.refilter( );
            }
            else if( key == 'show-tracker-scrapes' )
            {
                var b = this.prefs.getBool( key );
                Ext.getCmp(key).setValue( b );
                this.showScrapes = b;

                var v = this.gridPanel.getView();
                if( v.grid != null )
                    v.refresh( false );
            }
        }
    },

    destroy: function( )
    {
        this.prefs.removeListener( 'onPrefsChanged', this.onPrefsChanged );
        this.superclass().destroy.call( this );
    },

    filterFunc: function( record, id )
    {
        return this.showBackups || !record.data.isBackup;
    },

    refilter: function( )
    {
        this.store.filterBy( this.filterFunc, this );
    },

    onSelectionChanged: function( )
    {
        var hasSelection = this.gridPanel.getSelectionModel().hasSelection();

        this.addButton.setDisabled( false );
        this.editButton.setDisabled( !hasSelection );
        this.removeButton.setDisabled( !hasSelection );
    },

    onStoreLoaded: function( )
    {
        this.refilter( );
        this.onSelectionChanged( );
    },

    onAddPrompted: function( id, text )
    {
        if( id == 'ok' )
        {
            var url = text.trim( );
            this.session.addTrackers( this.torrentId, [ url ] );
        }
    },
    onAddClicked: function( )
    {
        Ext.Msg.prompt( 'Add Announce URL', 'Enter the Announce URL to be added:', this.onAddPrompted, this );
    },

    oldUrl: null,

    onEditPrompted: function( id, text )
    {
        if( id == 'ok' )
        {
            var newUrl = text.trim( );
            this.session.replaceTracker( this.torrentId, this.oldUrl, newUrl );
        }
    },

    onEditClicked: function( )
    {
        var url = this.gridPanel.getSelectionModel().getSelected().data.announce;
        this.oldUrl = url;
        Ext.Msg.prompt( 'Edit URL', 'Edit this Announce URL:', this.onEditPrompted, this, false, url );
    },

    onRemoveClicked: function( )
    {
        var records = this.gridPanel.getSelectionModel().getSelections();
        var n = records.length;
        var urls = new Array( n );
        for( var i=n; i--; )
            urls[i] = records[i].data.announce;
        this.session.removeTrackers( this.torrentId, urls );
    },

    onRecordsLoaded: function( store, records, options )
    {
        for( var i=records.length; i--; )
        {
            var data = records[i].data;
            data.uri = data.uri || parseUri(data.announce);
            data.host = getHost(data.uri);
        }
    },

    constructor: function( config_in )
    {
        var me = this;
        this.torrentId = config_in.record.getId();
        this.prefs = config_in.prefs;
        this.session = config_in.session;

        var record = Ext.data.Record.create([
            {name: 'announceState', type: 'int'},
            {name: 'announce', type: 'string'},
            {name: 'downloadCount', type: 'int'},
            {name: 'hasAnnounced', type: 'bool'},
            {name: 'hasScraped', type: 'bool'},
            {name: 'host', type: 'string'},
            {name: 'isBackup', type: 'bool'},
            {name: 'lastAnnouncePeerCount', type: 'int'},
            {name: 'lastAnnounceResult', type: 'string'},
            {name: 'lastAnnounceStartTime', type: 'int'},
            {name: 'lastAnnounceSucceeded', type: 'bool'},
            {name: 'lastAnnounceTimedOut', type: 'bool'},
            {name: 'lastAnnounceTime', type: 'int'},
            {name: 'lastScrapeResult', type: 'string'},
            {name: 'lastScrapeStartTime', type: 'int'},
            {name: 'lastScrapeSucceeded', type: 'bool'},
            {name: 'lastScrapeTimedOut', type: 'bool'},
            {name: 'lastScrapeTime', type: 'int'},
            {name: 'leecherCount', type: 'int'},
            {name: 'nextAnnounceTime', type: 'int'},
            {name: 'nextScrapeTime', type: 'int'},
            {name: 'scrapeState', type: 'int'},
            {name: 'scrape', type: 'string'},
            {name: 'seederCount', type: 'int'},
            {name: 'tier', type: 'int'},
            {name: 'uri', type: 'auto'}
        ]);

        var reader = new Ext.data.JsonReader({
                idProperty: 'announce',
                root: 'trackerStats',
                fields: record }, record );

        this.store = new Ext.data.Store({ reader: reader });
        this.store.addListener( 'load', this.onRecordsLoaded, this );

        var imgDir = Transmission.imgRoot + '/16x16/actions';
        var config = Ext.apply( {}, config_in, { layout : 'border', items: [
            { region: 'east', xtype: 'container', layout: { type: 'vbox', padding: '5', align: 'stretch' }, width: 40, items: [
                { xtype: 'button', id: 'add-tracker-button', tooltip: 'Add a Tracker', icon: imgDir+'/list-add.png', margin: { bottom: 30 } },
                { xtype: 'button', id: 'edit-tracker-button', tooltip: 'Edit a Tracker', icon: imgDir+'/document-properties.png' },
                { xtype: 'button', id: 'remove-tracker-button', tooltip: 'Remove a Tracker', icon: imgDir+'/list-remove.png' }]},
            { region: 'south', xtype: 'container', layout: { type: 'vbox', padding: '5', align: 'stretch' }, height: 50, items: [
                { xtype: 'checkbox', boxLabel: 'Show more details', id: 'show-tracker-scrapes', listeners: { check: { scope: this, fn: this.onShowScrapesChecked } } },
                { xtype: 'checkbox', boxLabel: 'Show backup trackers', id: 'show-backup-trackers', listeners: { check: { scope: this, fn: this.onShowBackupsChecked }}}]},
            { region: 'center', xtype: 'grid', layout: 'fit', id: 'tracker-grid-panel',
                columns: [ { id: 'maincol', header: 'Foo', dataIndex: 'announce', renderer: { fn: this.renderTracker, scope: this } } ],
                store: this.store,
                hideHeaders: true,
                hideLabel: true,
                multiSelect: true,
                stripeRows: true,
                autoExpandColumn: 'maincol' }
        ]});
        this.superclass().constructor.call( this, config );

        this.gridPanel = Ext.getCmp('tracker-grid-panel');
        this.gridPanel.getSelectionModel().addListener( 'selectionchange', this.onSelectionChanged, this );

        this.addButton = Ext.getCmp( 'add-tracker-button' );
        this.addButton.addListener( 'click', this.onAddClicked, this );
        this.editButton = Ext.getCmp( 'edit-tracker-button' );
        this.editButton.addListener( 'click', this.onEditClicked, this );
        this.removeButton = Ext.getCmp( 'remove-tracker-button' );
        this.removeButton.addListener( 'click', this.onRemoveClicked, this );

        this.refresh( config.record );
        this.prefs.addListener( 'onPrefsChanged', this.onPrefsChanged, this );
        this.onPrefsChanged( [ 'show-backup-trackers', 'show-tracker-scrapes' ] );
        this.store.addListener( 'load', this.onStoreLoaded, this );
    }
});

Ext.reg( 'trackerview', TrackerView );
