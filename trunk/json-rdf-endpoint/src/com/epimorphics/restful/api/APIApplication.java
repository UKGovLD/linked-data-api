/******************************************************************
 * File:        APIApplication.java
 * Created by:  Dave Reynolds
 * Created on:  7 Feb 2010
 * 
 * (c) Copyright 2010, Epimorphics Limited
 * $Id:  $
 *****************************************************************/

package com.epimorphics.restful.api;

import java.util.HashSet;
import java.util.Set;

import javax.ws.rs.core.Application;

/**
 * Packaging up the restlets which make up the API into a
 * deployable application
 * 
 * @author <a href="mailto:der@hplb.hpl.hp.com">Dave Reynolds</a>
 * @version $Revision: $
 */
public class APIApplication extends Application {

    public Set<Class<?>> getClasses() {
        Set<Class<?>> s = new HashSet<Class<?>>();
        s.add(DeploymentRestlet.class);
        s.add(RouterRestlet.class);
        s.add(ControlRestlet.class);
        s.add(MetadataRestlet.class);
        return s;
    }

}

