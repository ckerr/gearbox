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

(function()
{
    // private variables...
    var myPrefs;
    var mySession;
    var that;
    var scale = 'medium';
    var torrentView = null;

    function getAllRecordsUnfiltered( )
    {
        var r = torrentView.getStore().queryBy( function(){return true;} );
        return r.getRange();
    }

    function onSelectAllClicked( )
    {
        var n = torrentView.getStore().getCount();

        if( n > 0 )
        {
            // if "select all" was clicked when they're already all clicked,
            // deselect them all instead.
            if( n == torrentView.getSelectionCount() )
                torrentView.clearSelections(false);
            else
                torrentView.selectRange( 0, n );
        }
    }

    function onDeselectAllClicked( )
    {
        torrentView.clearSelections( false );
    }

    function getIdsFromRecords( records )
    {
        var n = records.length;
        var ids = new Array( n );
        for( var i=0; i<n; ++i )
            ids[i] = records[i].getId( );
        return ids;
    }
    function getSelectedIds( )
    {
        return getIdsFromRecords( torrentView.getSelectionModel().getSelections( ) );
    }
    function getAllIds( )
    {
        return getIdsFromRecords( torrentView.getStore().getRange() );
    }

    function closeSelectedTorrents( deleteFiles )
    {
        var connected = 0;
        var incomplete = 0;
        var primary_text;
        var secondary_text;

        var records = torrentView.getSelectionModel().getSelections( );
        var n = records.length;
        if( !n )
            return;

        var ids = new Array( n );
        for( var i=0; i<n; ++i )
        {
            var tor = records[i];

            ids[i] = tor.getId( );

            if( tor.peersConnected( ) > 0 )
                ++connected;

            if( !tor.isDone( ) )
                ++incomplete;
        }

        if( deleteFiles )
        {
            primary_text = n==1
                ? "Delete this torrent's downloaded files?"
                : String.format( "Delete these {0} torrents' downloaded files?", n );
        }
        else
        {
            primary_text = n==1
                ? 'Remove torrent?'
                : String.format( 'Remove {0} torrents?', n );
        }

        if( !incomplete && !connected )
        {
            secondary_text = n == 1
                ? "Once removed, continuing the transfer will require the torrent file or magnet link."
                : "Once removed, continuing the transfers will require the torrent files or magnet links.";
        }
        else if( n == incomplete )
        {
            secondary_text = n == 1
                ? "This torrent has not finished downloading."
                : "These torrents have not finished downloading.";
        }
        else if( n == connected )
        {
            secondary_text = n == 1
                ? "This torrent is connected to peers."
                : "These torrents are connected to peers.";
        }
        else
        {
            if( connected )
            {
                secondary_text = ( n == 1 )
                    ? "One of these torrents is connected to peers."
                    : "Some of these torrents are connected to peers.";
            }

            if( connected && incomplete )
                secondary_text += "\n";

            if( incomplete )
            {
                secondary_text += ( incomplete == 1 )
                    ? "One of these torrents has not finished downloading."
                    : "Some of these torrents have not finished downloading.";
            }
        }

        var body = String.format( '<p><b>{0}</b></p><br><p>{1}</p>', primary_text, secondary_text );
        Ext.MessageBox.confirm( 'Confirm', body, function(b,t) { if (b=='yes') mySession.removeTorrents(ids,deleteFiles); } );
    }

    function startAllTorrents( )           { mySession.startTorrents      ( getAllIds() ); }
    function stopAllTorrents( )            { mySession.stopTorrents       ( getAllIds() ); }
    function startSelectedTorrents( )      { mySession.startTorrents      ( getSelectedIds() ); }
    function stopSelectedTorrents( )       { mySession.stopTorrents       ( getSelectedIds() ); }
    function verifySelectedTorrents( )     { mySession.verifyTorrents     ( getSelectedIds() ); }
    function reannounceSelectedTorrents( ) { mySession.reannounceTorrents ( getSelectedIds() ); }

    function checkboxHandler( e, checked )
    {
        var o = { };
        o[e.id] = checked;
        myPrefs.set( o );
    }

    var menuSortModePrefix = 'menu-sort-mode-';

    function sortMenuHandler( e )
    {
        var mode = e.id.slice( menuSortModePrefix.length );
        myPrefs.set( {  'sort-mode': mode } );
    }

    function createToolbar( prefs )
    {
        var imgBase = Transmission.imgRoot + '/24x24'

        return new Ext.Toolbar( {
            id: 'mainwin-toolbar',
            defaults: { scale: scale, xtype: 'button', iconAlign: 'top' },
            items: [
                { icon: imgBase+'/actions/document-open.png', tooltip: 'Open a torrent', text: 'Open', handler: function() { that.fireEvent('onOpenClicked') } },
                { id:'toolbar-close-button', icon: imgBase+'/actions/window-close.png', tooltip: 'Close selected torrents', text: 'Close', handler: function() { closeSelectedTorrents(false); } },
                '-',
                { id:'toolbar-start-button', icon: imgBase+'/actions/media-playback-start.png', tooltip: 'Start selected torrents', text: 'Start', handler: startSelectedTorrents },
                { id:'toolbar-stop-button', icon: imgBase+'/actions/media-playback-pause.png', tooltip: 'Pause selected torrents', text: 'Stop', handler: stopSelectedTorrents },
                '-',
                { icon: imgBase+'/actions/edit-select-all.png', tooltip: 'Select all torrents', text: 'Select All', handler: onSelectAllClicked },
                '->',
                { id:'toolbar-details-button', icon: imgBase+'/status/dialog-information.png', text: 'Info', tooltip: 'Show/Hide the torrent inspector', handler: function(){ that.fireEvent('onDetailsClicked', { record: torrentView.getSelectionModel().getSelected() }); } },
                { icon: imgBase+'/apps/utilities-system-monitor.png', text: 'Stats', tooltip: 'Statistics dialog', handler: function(){ that.fireEvent('onStatsClicked') } },
                { icon: imgBase+'/categories/preferences-desktop.png', text: 'Settings', tooltip: 'Settings dialog', handler: function(){ that.fireEvent('onPrefsClicked') } }
                
            ]
        } );
    }

    var filterStatusPrefix = 'filter-status-';

    function filterStatusHandler( e )
    {
        myPrefs.set( { 'filter-mode': e.id.slice( filterStatusPrefix.length ) } );
    }

    var filterTrackerPrefix = 'filter-tracker-';

    function getNameFromHost( domain )
    {
        var pos = domain.lastIndexOf('.');
        var name = pos==-1 ? domain : domain.slice(0,pos);
        return Ext.util.Format.capitalize( name );
    }

    function updateTrackerMenuButton( )
    {
        var e = Ext.getCmp('filterbar-tracker');
        var host = myPrefs.get('filter-tracker');
        if( host === 'all' )
        {
            e.setIcon( null );
            e.setText( 'All Trackers' );
        }
        else
        {
            e.setIcon( String.format( 'http://{0}/favicon.ico', host ) );
            e.setText( getNameFromHost( host ) );
        }
    }

    function filterTrackerHandler( e )
    {
        var host = e.id.slice( filterTrackerPrefix.length );
        myPrefs.set( { 'filter-tracker': host } );
    }

    function createFilterbar( prefs )
    {
        var filterbarVisible = prefs.getBool( 'show-filterbar' );
        return new Ext.Toolbar( { hidden: !filterbarVisible, id: 'mainwin-filterbar', items: [
            { xtype: 'button', id: 'filterbar-status', menu: [
                { handler: filterStatusHandler, text: 'All',         id: filterStatusPrefix+'all' },
                { handler: filterStatusHandler, text: 'Active',      id: filterStatusPrefix+'active' },
                { handler: filterStatusHandler, text: 'Downloading', id: filterStatusPrefix+'downloading' },
                { handler: filterStatusHandler, text: 'Seeding',     id: filterStatusPrefix+'seeding' },
                { handler: filterStatusHandler, text: 'Paused',      id: filterStatusPrefix+'paused' },
                { handler: filterStatusHandler, text: 'Finished',    id: filterStatusPrefix+'finished' },
                { handler: filterStatusHandler, text: 'Queued',      id: filterStatusPrefix+'queued' },
                { handler: filterStatusHandler, text: 'Verifying',   id: filterStatusPrefix+'verifying' },
                { handler: filterStatusHandler, text: 'Error',       id: filterStatusPrefix+'error' } ] },
            { xtype: 'button', id: 'filterbar-tracker', menu: [
                { handler: filterTrackerHandler, text: 'All Trackers', id: filterTrackerPrefix+'all' }
            ]},
            '->',
            { id: 'statusbarTorrentCountLabel', xtype: 'label', text: 'No torrents' },
            '-',
            { id: 'statusbarDownSpeed', xtype: 'label', text: '↓ {0}{1}' },
            ' ',
            { id: 'statusbarUpSpeed', xtype: 'label', text: '↑ {0}{1}' },
        ]});
    }

    function createStatusbar( prefs )
    {
        var viewMenu = new Ext.menu.Menu( { defaultType: 'menucheckitem', items: [
            { text: 'Compact View', id: 'compact-view', listeners: { checkchange: checkboxHandler } },
            '-',
            { group: 'sort-mode', handler: sortMenuHandler, text: 'Sort by Age',       id: menuSortModePrefix+'age' },
            { group: 'sort-mode', handler: sortMenuHandler, text: 'Sort by Name',      id: menuSortModePrefix+'name' },
            { group: 'sort-mode', handler: sortMenuHandler, text: 'Sort by Progress',  id: menuSortModePrefix+'progress' },
            { group: 'sort-mode', handler: sortMenuHandler, text: 'Sort by Ratio',     id: menuSortModePrefix+'ratio' },
            { group: 'sort-mode', handler: sortMenuHandler, text: 'Sort by Size',      id: menuSortModePrefix+'size' },
            { group: 'sort-mode', handler: sortMenuHandler, text: 'Sort by State',     id: menuSortModePrefix+'state' },
            { group: 'sort-mode', handler: sortMenuHandler, text: 'Sort by Time Left', id: menuSortModePrefix+'time-left' },
            { group: 'sort-mode', handler: sortMenuHandler, text: 'Sort by Tracker',   id: menuSortModePrefix+'tracker' },
            '-',
            { text: 'Reverse sort', id: 'sort-reversed', listeners: { checkchange: checkboxHandler } }
        ]});

        var actionMenu = new Ext.menu.Menu( { items: [
            { text: 'Session Statistics', handler: function(){ that.fireEvent('onStatsClicked') } },
            { text: 'Edit Preferences', handler: function(){ that.fireEvent('onPrefsClicked') } },
            '-',
            { id: 'menu-reannounce', text: 'Ask Tracker for More Peers', handler: reannounceSelectedTorrents },
            { id: 'menu-verify', text: 'Verify Local Data', handler: verifySelectedTorrents },
            '-',
            { text: 'Donate', handler: function(){ window.open('http://www.transmissionbt.com/donate.php'); } },
        ]});

        return new Ext.Toolbar( { id: 'mainwin-statusbar', items: [
            { menu: actionMenu, icon: Transmission.imgRoot + '/ActionHover.png' },
            ' ', ' ', // these two buttons are pretty small on a cell phone.. add a little extra space between them
            { text: 'View', menu: viewMenu },
        ]});
    }

    function updateActionSensitivity( )
    {
        // FIXME: this should be on a timer -- it's called too often

        var records = torrentView.getSelectionModel().getSelections( );
        var selectedCount = records.length;
        var selectedPausedCount = 0;
        for( var i=0; i<selectedCount; ++i )
            if( records[i].isPaused( ) )
                ++selectedPausedCount;

        records = torrentView.getStore().getRange();
        var allCount = records.length;
        var pausedCount = 0;
        for( var i=0; i<allCount; ++i )
            if( records[i].isPaused( ) )
                ++pausedCount;

        Ext.getCmp( 'toolbar-stop-button' ).setDisabled( selectedPausedCount == selectedCount );
        Ext.getCmp( 'toolbar-close-button' ).setDisabled( selectedCount == 0 );
        Ext.getCmp( 'toolbar-start-button' ).setDisabled( selectedPausedCount == 0 );
        Ext.getCmp( 'toolbar-details-button' ).setDisabled( selectedCount != 1 );

        Ext.getCmp( 'menu-verify').setDisabled( selectedCount == 0 );
        Ext.getCmp( 'menu-reannounce').setDisabled( selectedPausedCount == selectedCount );
    }

    function onSelectionChanged( )
    {
        updateActionSensitivity( );
    }

    var isStoreUpdatePending = false;

    function onStoreChangedIdle( )
    {
        updateActionSensitivity( );
        rebuildTrackerFilter( );
        resort( );
        refilter( );
        isStoreUpdatePending = false;
    }

    function onStoreChanged( )
    {
        if( !isStoreUpdatePending )
        {
            isStoreUpdatePending = true;
            onStoreChangedIdle.defer( 250, this );
        }
    }

    function onRowsAdded( )
    {
        onStoreChanged( );
        //resort( );
        //updateActionSensitivity( );
        //refilter( );
    }

    function createTorrentList( )
    {
        var view = new TorrentView( { flex: 1, id:'torrent-list-view', store: Torrent.store, } );
        torrentView = view;
        torrentView.getSelectionModel().addListener( 'selectionchange', onSelectionChanged );
        torrentView.addListener('rowdblclick', function(grid,index,e){
            that.fireEvent('onDetailsClicked', { record: Torrent.store.getAt(index) } );
        });
        Torrent.store.addListener( 'update', onStoreChanged );
        Torrent.store.addListener( 'add', onRowsAdded );
        return torrentView;
    }

    function setToolbarVisible( b )
    {
        //Ext.getCmp( 'show-toolbar' ).setChecked( b );
        Ext.getCmp( 'mainwin-toolbar' ).setVisible( b );
        myPrefs.set( { 'show-toolbar': b } );
        that.doLayout( );
    }

    function setFilterbarVisible( b )
    {
        //Ext.getCmp( 'show-filterbar' ).setChecked( b );
        Ext.getCmp( 'mainwin-filterbar' ).setVisible( b );
        myPrefs.set( { 'show-filterbar': b } );
        that.doLayout( );
    }

    function setStatusbarVisible( b )
    {
        //Ext.getCmp( 'show-statusbar' ).setChecked( b );
        Ext.getCmp( 'mainwin-statusbar' ).setVisible( b );
        myPrefs.set( { 'show-statusbar': b } );
        that.doLayout( );
    }

    function rebuildTrackerFilter( )
    {
        var hash = { };
        var allrecs = getAllRecordsUnfiltered();
        for( var i=0; i<allrecs.length; ++i ) {
            var record = allrecs[i];
            for( var j=0; j<record.data.trackers.length; ++j ) {
                var tracker = record.data.trackers[j];
                var host = getHost( tracker.announce );
                var name = getNameFromHost( host );
                hash[name] = host;
            }
        }

        var keys = [ ];
        for( var key in hash )
            keys.push( key );
        keys.sort( );

        var rows = [ ];
        rows.push( { handler: filterTrackerHandler, text: 'All Trackers', id: filterTrackerPrefix+'all' } );
        rows.push( '-' );
        for( var i=0, n=keys.length; i<n; ++i ) {
            var name = keys[i];
            var domain = hash[name];
            rows.push( { handler: filterTrackerHandler,
                         text: name,
                         icon: String.format( 'http://{0}/favicon.ico', domain ),
                         id: filterTrackerPrefix+domain } );
        }

        var e = Ext.getCmp('filterbar-tracker');
        var oldMenu = e.menu;
        e.menu = new Ext.menu.Menu( rows );
        if( oldMenu ) delete oldMenu;
    }

    function filterByStatus( rec )
    {
        var accepts;
        var mode = myPrefs.get('filter-mode');

        switch( mode ) {
            case 'active':      accepts = rec.isActive(); break;
            case 'downloading': accepts = rec.isDownloading(); break;
            case 'seeding':     accepts = rec.isSeeding(); break;
            case 'paused':      accepts = rec.isPaused(); break;
            case 'finished':    accepts = rec.isFinished(); break;
            case 'queued':      accepts = false; break;
            case 'verifying':   accepts = rec.isVerifying() || rec.isWaitingToVerify(); break;
            case 'error':       accepts = rec.isDownloading(); break;
            default:            accepts = true; break;
        }

        return accepts;
    }
    function filterByTracker( rec )
    {
        var tracker = myPrefs.get('filter-tracker');
        if( tracker === 'all' )
            return true;

        for( var i=0, n=rec.data.trackers.length; i<n; ++i )
            if( rec.data.trackers[i].announce.indexOf( tracker ) >= 0 )
                return true;

        return false;
    }
    function filterFunc( rec, id )
    {
        return filterByStatus(rec) && filterByTracker(rec);
    }
    function refilter( )
    {
        Torrent.store.filterBy( filterFunc, this );
        updateTorrentCount( );
    }

    function resort( )
    {
        var dir = myPrefs.getBool('sort-reversed') ? 'DESC' : 'ASC';
        var fieldName;
        switch( myPrefs.get('sort-mode') ) {
            case 'age':       fieldName = 'addedDate';    break;
            case 'progress':  fieldName = 'percentDone';  break;
            case 'ratio':     fieldName = 'uploadRatio';  break;
            case 'size':      fieldName = 'totalSize';    break;
            case 'state':     fieldName = 'state';        break;
            case 'time-left': fieldName = 'eta';          break;
            case 'tracker':   fieldname = 'trackers';     break; // FIXME
            default:          fieldName = 'collatedName'; break;
        }
        Torrent.store.sort( fieldName, dir );
        Torrent.store.setDefaultSort( fieldName, dir );
    }

    function onPrefsChanged( keys )
    {
        var doSort = false;
        var doFilter = false;

        for( var i=0, n=keys.length; i<n; ++i )
        {
            var key = keys[i];

            switch( key )
            {
                case 'show-toolbar':
                    setToolbarVisible( myPrefs.getBool( key ) );
                    break;

                case 'show-filterbar':
                    setFilterbarVisible( myPrefs.getBool( key ) );
                    break;

                case 'show-statusbar':
                    setStatusbarVisible( myPrefs.getBool( key ) );
                    break;

                case 'compact-view': {
                    var b = myPrefs.getBool( key );
                    Ext.getCmp(key).setChecked( b );
                    torrentView.setCompact( b );
                    break;
                }

                case 'sort-mode': {
                    var v = myPrefs.get( key );
                    if( v == 'undefined' ) v = 'name';
                    Ext.getCmp(menuSortModePrefix+v).setChecked(true);
                    doSort = true;
                    break;
                }

                case 'sort-reversed':
                    Ext.getCmp(key).setChecked( myPrefs.getBool( key ) );
                    doSort = true;
                    break;

                case 'filter-mode': {
                    var v = myPrefs.get( key );
                    var e = Ext.getCmp( 'filterbar-status' );
                    e.setText( Ext.util.Format.capitalize( v ) );
                    // FIXME: icon
                    doFilter = true;
                    break;
                }

                case 'filter-tracker': {
                    updateTrackerMenuButton( );
                    doFilter = true;
                    break;
                }

                default:
                    break;
            }
        }

        if( doSort )
            resort( );
        if( doFilter )
            refilter( );

    }

    function updateTorrentCount( )
    {
        var count = Torrent.store.getCount();
        var total = Torrent.store.getTotalCount();

        var str = Ext.util.Format.plural( total, 'Torrent' );
        if( count < total )
            str = '' + count + ' of ' + str;

        var key = 'statusbarTorrentCountLabel';
        Ext.getCmp( key ).setText( str );
    }

    function updateStatusbar( o )
    {
        updateTorrentCount( );

        var key = 'statusbarDownSpeed';
        var str = Transmission.fmt.speed( o.downloadSpeed ) + ' &darr;';
        Ext.getCmp( key ).update( str );

        key = 'statusbarUpSpeed';
        str = Transmission.fmt.speed( o.uploadSpeed ) + ' &uarr;';
        Ext.getCmp( key ).update( str );
    }

    function onStatsChanged( o )
    {
        updateStatusbar( o );
    }

    Transmission.MainWin = Ext.extend( Ext.Viewport, {

        constructor: function( config_in )
        {
            that = this;
            myPrefs = config_in.prefs;
            mySession = config_in.session;

            var config = {
                layout: { type: 'vbox', align: 'stretch', pack: 'start' },
                items: [ createToolbar(myPrefs), createFilterbar(myPrefs), createTorrentList(myPrefs), createStatusbar(myPrefs) ]
            };
            Ext.applyIf( config, config_in );
            Transmission.MainWin.superclass.constructor.call( this, config );

            this.addEvents( 'onFilterClicked' );
            this.addEvents( 'onStatsClicked' );
            this.addEvents( 'onOpenClicked' );
            this.addEvents( 'onPrefsClicked' );
            this.addEvents( 'onDetailsClicked' );

            myPrefs.addListener( 'onPrefsChanged', onPrefsChanged );
            mySession.addListener( 'onStatsChanged', onStatsChanged );

            onSelectionChanged( );
            onStoreChangedIdle( );

            onPrefsChanged( [ 'show-toolbar', 'show-statusbar',
                              'show-filterbar', 'compact-view',
                              'sort-mode', 'sort-reversed',
                              'filter-mode', 'filter-tracker' ] );
        }
    });
}());
