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
    var myPrefs,
        mySession,
        that,
        scale = 'medium',
        torrentView = null;

    function onTurtleToggled( btn, pressed )
    {
        mySession.set({ 'alt-speed-enabled': pressed });
    }

    function getIdsFromRecords( records )
    {
        var i=records.length, ids=new Array(i);
        while(i--)
            ids[i] = records[i].getId( );
        return ids;
    }
    function getSelectedIds( )
    {
        return getIdsFromRecords( torrentView.getSelectedRecords( ) );
    }

    function closeSelectedTorrents( deleteFiles )
    {
        var connected = 0,
            incomplete = 0,
            primary_text,
            secondary_text,
            ids,
            records = torrentView.getSelectedRecords(),
            n = records.length;

        if( !n )
            return;

        ids = new Array( n );
        for( var i=n; i--; )
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
        var imgBase = Transmission.imgRoot + '/toolbar/';

        return new Ext.Toolbar( {
            id: 'mainwin-toolbar',
            defaults: { scale: scale, xtype: 'button', iconAlign: 'top' },
            items: [
                { id:'toolbar-start-button', icon: imgBase+'play.png', tooltip: 'Start selected torrents', handler: startSelectedTorrents },
                { id:'toolbar-stop-button', icon: imgBase+'pause.png', tooltip: 'Pause selected torrents', handler: stopSelectedTorrents },
                { icon: imgBase+'add.png', tooltip: 'Open a torrent', handler: function() { that.fireEvent('onOpenClicked'); } },
                { id:'toolbar-close-button', icon: imgBase+'close.png', tooltip: 'Close selected torrents', handler: function() { closeSelectedTorrents(false); } }
            ]
        } );
    }

    var filterStatusPrefix = 'filter-status-';

    function filterStatusHandler( e )
    {
        myPrefs.set( { 'filter-mode': e.id.slice( filterStatusPrefix.length ) } );
    }

    var filterTrackerPrefix = 'filter-tracker-';

    function updateTrackerMenuButton( )
    {
        var e = Ext.getCmp('filterbar-tracker'),
            host = myPrefs.get('filter-tracker');

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
        var viewMenu = new Ext.menu.Menu( { defaultType: 'menucheckitem', items: [
            { group: 'sort-mode', handler: sortMenuHandler, text: 'Sort by Activity',  id: menuSortModePrefix+'activity' },
            { group: 'sort-mode', handler: sortMenuHandler, text: 'Sort by Age',       id: menuSortModePrefix+'age' },
            { group: 'sort-mode', handler: sortMenuHandler, text: 'Sort by Name',      id: menuSortModePrefix+'name' },
            { group: 'sort-mode', handler: sortMenuHandler, text: 'Sort by Progress',  id: menuSortModePrefix+'progress' },
            { group: 'sort-mode', handler: sortMenuHandler, text: 'Sort by Ratio',     id: menuSortModePrefix+'ratio' },
            { group: 'sort-mode', handler: sortMenuHandler, text: 'Sort by Size',      id: menuSortModePrefix+'size' },
            { group: 'sort-mode', handler: sortMenuHandler, text: 'Sort by State',     id: menuSortModePrefix+'state' },
            { group: 'sort-mode', handler: sortMenuHandler, text: 'Sort by Time Left', id: menuSortModePrefix+'time-left' },
            '-',
            { text: 'Reverse Sort Order', id: 'sort-reversed', listeners: { checkchange: checkboxHandler } }
        ]});

        var iconPrefix = Transmission.imgRoot+'/16x16',
            filterbarVisible = prefs.getBool( 'show-filterbar' );

        return new Ext.Toolbar( { hidden: !filterbarVisible, id: 'mainwin-filterbar', items: [
            { xtype: 'button', text: 'Sort', menu: viewMenu },
            { xtype: 'button', id: 'filterbar-status', menu: [
                { handler: filterStatusHandler, text: 'All',         id: filterStatusPrefix+'all' },
                '-',
                { handler: filterStatusHandler, text: 'Active',      id: filterStatusPrefix+'active', icon:iconPrefix+'/actions/system-run.png' },
                { handler: filterStatusHandler, text: 'Downloading', id: filterStatusPrefix+'downloading', icon:iconPrefix+'/actions/go-down.png' },
                { handler: filterStatusHandler, text: 'Seeding',     id: filterStatusPrefix+'seeding', icon:iconPrefix+'/actions/go-up.png' },
                { handler: filterStatusHandler, text: 'Paused',      id: filterStatusPrefix+'paused', icon:iconPrefix+'/actions/media-playback-pause.png' },
                { handler: filterStatusHandler, text: 'Finished',    id: filterStatusPrefix+'finished' },
                { handler: filterStatusHandler, text: 'Queued',      id: filterStatusPrefix+'queued' },
                { handler: filterStatusHandler, text: 'Verifying',   id: filterStatusPrefix+'verifying', icon:iconPrefix+'/actions/view-refresh.png' },
                { handler: filterStatusHandler, text: 'Error',       id: filterStatusPrefix+'error', icon:iconPrefix+'/status/error.png' } ] },
            { xtype: 'button', id: 'filterbar-tracker', listeners: { menushow: { fn:rebuildTrackerMenu } },menu: [
                { handler: filterTrackerHandler, text: 'All Trackers', id: filterTrackerPrefix+'all' }
            ]},
            '->',
            { id: 'statusbarTorrentCountLabel', xtype: 'label', text: 'No torrents' }
        ]});
    }

    function createStatusbar( prefs )
    {
        var actionMenu = new Ext.menu.Menu( { items: [
            { text: 'Session Statistics', handler: function(){ that.fireEvent('onStatsClicked'); } },
            { text: 'Edit Preferences', handler: function(){ that.fireEvent('onPrefsClicked'); } },
            '-',
            { id: 'menu-reannounce', text: 'Ask Tracker for More Peers', handler: reannounceSelectedTorrents },
            { id: 'menu-verify', text: 'Verify Local Data', handler: verifySelectedTorrents },
            '-',
            { xtype: 'menucheckitem', text: 'Compact View', id: 'compact-view', listeners: { checkchange: checkboxHandler } },
            '-',
            { text: 'Transmission Website', handler: function(){ window.open('http://www.transmissionbt.com/'); } },
            { text: 'Donate', handler: function(){ window.open('http://www.transmissionbt.com/donate.php'); } }
        ]});

        return new Ext.Toolbar( { id: 'mainwin-statusbar', items: [
            { xtype: 'button', menu:actionMenu, cls: 'mainwin-statusbar-button', icon: Transmission.imgRoot + '/action.png' },
            ' ', ' ', // these two buttons are pretty small on a cell phone.. add a little extra space between them
            { xtype: 'button', id:'turtle-button', cls: 'mainwin-statusbar-button x-btn-icon turtle-btn', enableToggle: true, listeners: { toggle: { scope: this, fn: onTurtleToggled } } },
            '->',
            { id: 'statusbarDownSpeed', xtype: 'label', text: '↓ {0}{1}' },
            ' ', '-', ' ',
            { id: 'statusbarUpSpeed', xtype: 'label', text: '↑ {0}{1}' }
        ]});
    }

    function updateActionSensitivity( )
    {
        // FIXME: this should be on a timer -- it's called too often

        var records = torrentView.getSelectedRecords(),
            selectedCount = records.length,
            selectedPausedCount = 0,
            i;

        for( i=selectedCount; i--; )
            if( records[i].isPaused( ) )
                ++selectedPausedCount;

        Ext.getCmp( 'toolbar-stop-button' ).setDisabled( selectedPausedCount == selectedCount );
        Ext.getCmp( 'toolbar-close-button' ).setDisabled( selectedCount === 0 );
        Ext.getCmp( 'toolbar-start-button' ).setDisabled( selectedPausedCount === 0 );

        Ext.getCmp( 'menu-verify').setDisabled( selectedCount === 0 );
        Ext.getCmp( 'menu-reannounce').setDisabled( selectedPausedCount == selectedCount );
    }

    function onSelectionChanged( )
    {
        updateActionSensitivity( );
    }

    var storeChangedTimer = null;

    function refreshStore(store)
    {
        if(store && !store.isDummy)
        {
            store.suspendEvents(false);

            updateActionSensitivity();
            resort(store);
            refilter(store);

            store.resumeEvents();
            store.fireEvent('datachanged', store);
        }
    }
    function onStoreChangedIdle( e )
    {
        refreshStore(torrentView.getStore());
    }

    function onStoreChanged( e )
    {
        if( storeChangedTimer )
            clearTimeout( storeChangedTimer );
        storeChangedTimer = onStoreChangedIdle.defer(500,[]);
    }

    function onRowsAdded( )
    {
        onStoreChanged( );
    }

    function onDoubleClick( view, index, node, e )
    {
        that.fireEvent( 'onDetailsClicked', { record: torrentView.getStore().getAt(index) } );
    }

    function createTorrentList( )
    {
        // loading Torrent.store initially causes a *lot* of load on TorrentView,
        // so let's not bind to it until after we get that first batch of torrents
        // from the server...
        var dummyStore = new Ext.data.Store({ autoDestroy: true });
        dummyStore.isDummy = true;
        var view = new TorrentView({ flex: 1, id:'torrent-list-view', store:dummyStore });
        torrentView = view;
        view.addListener('selectionchange', onSelectionChanged);
        view.addListener('dblclick', onDoubleClick);
        return view;
    }

    var trackersStr = '';

    function rebuildTrackerMenu( )
    {
        var key,
            hash = Torrent.store.getAllTrackers(),
            keys = [ ];

        for(key in hash)
            keys.push(key);
        keys.sort( );

        // if the list of trackers has changed update the "trackers" button's menu
        var str = keys.toString();
        if( trackersStr != str )
        {
            trackersStr = str;

            var menu = Ext.getCmp('filterbar-tracker').menu,
                rows = [ ];

            menu.removeAll();

            rows.push( { handler: filterTrackerHandler, text: 'All Trackers', id: filterTrackerPrefix+'all' } );
            rows.push( '-' );
            for( var i=0, n=keys.length; i<n; ++i ) {
                var name = keys[i],
                    domain = hash[name];
                rows.push( { handler: filterTrackerHandler,
                             text: name,
                             icon: String.format( 'http://{0}/favicon.ico', domain ),
                             id: filterTrackerPrefix+domain } );
            }

            menu.add( rows );
        }
    }

    function filterByStatus( rec )
    {
        var accepts,
            mode = myPrefs.get('filter-mode');

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

        var trackers = rec.data.trackers;
        for(var i=trackers.length; i--; )
            if( trackers[i].announce.indexOf( tracker ) >= 0 )
                return true;

        return false;
    }
    function filterFunc( rec, id )
    {
        return filterByStatus(rec) && filterByTracker(rec);
    }
    function refilter(store)
    {
        if(!store || store.isDummy)
            return;

        var selected = torrentView.getSelectedRecords();
        Torrent.store.filterBy( filterFunc, this );
        updateTorrentCount( );
        reSelect( selected );
    }

    function resort(store)
    {
        if(!store || store.isDummy)
            return;

        var fieldName,
            desc = myPrefs.getBool('sort-reversed'),
            selected = torrentView.getSelectedRecords();

        switch( myPrefs.get('sort-mode') ) {
            case 'activity':  fieldName = 'rateXfer';     desc=!desc; break;
            case 'age':       fieldName = 'addedDate';    desc=!desc; break;
            case 'progress':  fieldName = 'percentDone';  break;
            case 'ratio':     fieldName = 'uploadRatio';  break;
            case 'size':      fieldName = 'totalSize';    break;
            case 'state':     fieldName = 'state';        break;
            case 'time-left': fieldName = 'eta';          break;
            default:          fieldName = 'collatedName'; break;
        }

        var dir = desc ? 'DESC' : 'ASC';
        store.sort( fieldName, dir );
        store.setDefaultSort( fieldName, dir );
        reSelect( selected );
    }

    function reSelect( records )
    {
        if( records.length < 1 )
            return;

        var newRecords = torrentView.getRecords( torrentView.getNodes() ),
            s = [],
            i = records.length,
            rec;

        while( i-- ) {
            rec = records[i];
            if( newRecords.indexOf( rec ) != -1 )
                s.push( rec );
        }

        torrentView.select( s );
    }

    function onPrefsChanged( keys )
    {
        var doSort = false,
            doFilter = false,
            doLayout = false,
            doTurtleTooltip = false,
            i = keys.length;

        while( i-- )
        {
            var key = keys[i];

            switch( key )
            {
                case 'alt-speed-up':
                case 'alt-speed-down':
                    doTurtleTooltip = true;
                    break;

                case 'alt-speed-enabled':
                    doTurtleTooltip = true;
                    Ext.getCmp('turtle-button').toggle( myPrefs.getBool( key ) );
                    break;

                case 'show-toolbar':
                    Ext.getCmp('mainwin-toolbar').setVisible( myPrefs.getBool(key) );
                    doLayout = true;
                    break;

                case 'show-filterbar':
                    Ext.getCmp('mainwin-filterbar').setVisible( myPrefs.getBool(key) );
                    doLayout = true;
                    break;

                case 'show-statusbar':
                    Ext.getCmp('mainwin-statusbar').setVisible( myPrefs.getBool(key) );
                    doLayout = true;
                    break;

                case 'compact-view': {
                    var b = myPrefs.getBool( key );
                    Ext.getCmp(key).setChecked( b );
                    torrentView.setCompact( b );
                    break;
                }

                case 'sort-mode': {
                    var v = myPrefs.get( key ),
                        e = Ext.getCmp(menuSortModePrefix+v);
                    if( !e ) e = Ext.getCmp(menuSortModePrefix+'name');
                    e.setChecked(true);
                    doSort = true;
                    break;
                }

                case 'sort-reversed':
                    Ext.getCmp(key).setChecked( myPrefs.getBool( key ) );
                    doSort = true;
                    break;

                case 'filter-mode': {
                    var v = myPrefs.get( key ),
                        e = Ext.getCmp( 'filterbar-status' );
                    e.setText( Ext.util.Format.capitalize( v ) );
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

        if(doSort) resort(torrentView.getStore());
        if(doFilter) refilter(torrentView.getStore());
        if(doLayout) that.doLayout();

        if( doTurtleTooltip ) {
            var s,
                enabled = myPrefs.getBool( 'alt-speed-enabled' ),
                up = Transmission.fmt.speed( myPrefs.getNumber( 'alt-speed-up' ) ),
                dn = Transmission.fmt.speed( myPrefs.getNumber( 'alt-speed-down' ) );
            if( enabled )
                s = String.format( "Click to disable Temporary Speed Limits<br/>({0} down, {1} up)", dn, up );
            else
                s = String.format( "Click to enable Temporary Speed Limits<br/>({0} down, {1} up)", dn, up );
            Ext.getCmp('turtle-button').setTooltip(s);
        }
    }

    function updateTorrentCount( )
    {
        var store = Torrent.store,
            count = store.getCount(),
            total = store.getUnfilteredCount(),
            key = 'statusbarTorrentCountLabel',
            str = Ext.util.Format.plural( total, 'Torrent' );

        if( count < total )
            str = [ count, 'of', str ].join(' ');

        Ext.getCmp( key ).setText( str );
    }

    function updateStatusbar( o )
    {
        updateTorrentCount( );

        var key = 'statusbarDownSpeed',
            str = Transmission.fmt.speedBps( o.downloadSpeed ) + ' Down';
        Ext.getCmp( key ).update( str );

        key = 'statusbarUpSpeed';
        str = Transmission.fmt.speedBps( o.uploadSpeed ) + ' Up';
        Ext.getCmp( key ).update( str );
    }

    function onStatsChanged( o )
    {
        updateStatusbar( o );
    }

    Transmission.MainWin = Ext.extend( Ext.Viewport, {

        setTorrentStore: function(store){
            if(torrentView.getStore() != store) {
                refreshStore(store);
                torrentView.bindStore(store);
                store.addListener('update', onStoreChanged);
                store.addListener('add', onRowsAdded);
            }
        },

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
            this.superclass().constructor.call(this, config);

            this.addEvents( 'onFilterClicked' );
            this.addEvents( 'onStatsClicked' );
            this.addEvents( 'onOpenClicked' );
            this.addEvents( 'onPrefsClicked' );
            this.addEvents( 'onDetailsClicked' );

            myPrefs.addListener( 'onPrefsChanged', onPrefsChanged );
            mySession.addListener( 'onStatsChanged', onStatsChanged );

            onSelectionChanged( );
            onStoreChanged( );

            onPrefsChanged( [ 'show-toolbar', 'show-statusbar',
                              'show-filterbar', 'compact-view',
                              'sort-mode', 'sort-reversed',
                              'filter-mode', 'filter-tracker',
                              'alt-speed-enabled' ] );
        }
    });
}());
