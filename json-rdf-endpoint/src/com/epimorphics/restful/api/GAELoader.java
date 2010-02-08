/******************************************************************
 * File:        GAELoader.java
 * Created by:  Dave Reynolds
 * Created on:  7 Feb 2010
 * 
 * (c) Copyright 2010, Epimorphics Limited
 * $Id:  $
 *****************************************************************/

package com.epimorphics.restful.api;

import javax.servlet.http.HttpServlet;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


/**
 * Bootstrap loader for use in a GAE environment
 * 
 * @author <a href="mailto:der@hplb.hpl.hp.com">Dave Reynolds</a>
 * @version $Revision: $
 */
public class GAELoader extends HttpServlet {
    
    private static final long serialVersionUID = -7753918526852617424L;
    
    static Logger log = LoggerFactory.getLogger(Loader.class);
    
    public void init() {
//        SpecManagerFactory.set( new SpecManagerImpl(RouterFactory.get()) );
        SpecManagerFactory.set( SpecManagerGAE.loadOrCreate( RouterFactory.get() ) );
    }
    
}

