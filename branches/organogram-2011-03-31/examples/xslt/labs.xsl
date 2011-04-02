<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:import href="result.xsl" />

<xsl:variable name="transportPrefix" select="'http://transport.data.gov.uk/'" />
<xsl:variable name="transportIdPrefix" select="'http://transport.data.gov.uk/id/'" />

<xsl:variable name="postcodeUnitPrefix" select="'http://data.ordnancesurvey.co.uk/id/postcodeunit/'" />
<xsl:variable name="postcodeSectorPrefix" select="'http://data.ordnancesurvey.co.uk/id/postcodesector/'" />
<xsl:variable name="postcodeDistrictPrefix" select="'http://data.ordnancesurvey.co.uk/id/postcodedistrict/'" />
<xsl:variable name="postcodeAreaPrefix" select="'http://data.ordnancesurvey.co.uk/id/postcodearea/'" />
	
<xsl:template match="@href" mode="uri">
	<xsl:choose>
		<xsl:when test="starts-with(., $transportIdPrefix)">
			<xsl:value-of select="concat('/lod/transport/doc/', substring-after(., $transportIdPrefix))" />
		</xsl:when>
		<xsl:when test="starts-with(., $transportPrefix)">
			<xsl:value-of select="concat('/lod/transport/', substring-after(., $transportPrefix))" />
		</xsl:when>
		<xsl:when test="starts-with(., $postcodeUnitPrefix)">
			<xsl:value-of select="concat('/lod/os/postcode/', substring-after(., $postcodeUnitPrefix))" />
		</xsl:when>
		<xsl:when test="starts-with(., $postcodeSectorPrefix)">
			<xsl:value-of select="concat('/lod/os/postcode-sector/', substring-after(., $postcodeSectorPrefix))" />
		</xsl:when>
		<xsl:when test="starts-with(., $postcodeDistrictPrefix)">
			<xsl:value-of select="concat('/lod/os/postcode-district/', substring-after(., $postcodeDistrictPrefix))" />
		</xsl:when>
		<xsl:when test="starts-with(., $postcodeAreaPrefix)">
			<xsl:value-of select="concat('/lod/os/postcode-area/', substring-after(., $postcodeAreaPrefix))" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="." />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>
	
<xsl:template match="isPartOf" mode="moreinfo">
	<xsl:variable name="base" select="substring-after(@href, 'http://labs.data.gov.uk')" />
	<xsl:variable name="path" select="substring-before(concat($base, '?'), '?')" />
	<xsl:call-template name="labsLinks">
		<xsl:with-param name="base" select="$path" />
	</xsl:call-template>
</xsl:template>

<xsl:template match="primaryTopic" mode="moreinfo">
	<xsl:call-template name="labsLinks">
		<xsl:with-param name="base">
			<xsl:choose>
				<xsl:when test="starts-with(@href, 'http://transport.data.gov.uk/id/')">
					<xsl:value-of select="concat('/lod/transport/doc/', substring-after(@href, '/id/'))"/>
				</xsl:when>
				<xsl:when test="starts-with(@href, 'http://transport.data.gov.uk/')">
					<xsl:value-of select="concat('/lod/transport/', substring-after(@href, 'http://transport.data.gov.uk/'))"/>
				</xsl:when>
				<xsl:when test="starts-with(@href, $postcodeUnitPrefix)">
					<xsl:value-of select="concat('/lod/os/postcode/', substring-after(@href, $postcodeUnitPrefix))" />
				</xsl:when>
				<xsl:when test="starts-with(@href, $postcodeSectorPrefix)">
					<xsl:value-of select="concat('/lod/os/postcode-sector/', substring-after(@href, $postcodeSectorPrefix))" />
				</xsl:when>
				<xsl:when test="starts-with(@href, $postcodeDistrictPrefix)">
					<xsl:value-of select="concat('/lod/os/postcode-district/', substring-after(@href, $postcodeDistrictPrefix))" />
				</xsl:when>
				<xsl:when test="starts-with(@href, $postcodeAreaPrefix)">
					<xsl:value-of select="concat('/lod/os/postcode-area/', substring-after(@href, $postcodeAreaPrefix))" />
				</xsl:when>
				<xsl:when test="starts-with(@href, 'http://data.ordnancesurvey.co.uk/id/')">
					<xsl:value-of select="concat('/lod/os/', substring-after(@href, '/id/'))"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="concat('/lod/os/', substring-after(@href, 'http://data.ordnancesurvey.co.uk/'))"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:with-param>
	</xsl:call-template>
</xsl:template>
	
<xsl:template name="labsLinks">
	<xsl:param name="base" />
	<xsl:choose>
		<xsl:when test="starts-with($base, '/lod/os/')">
			<xsl:call-template name="osLinks">
				<xsl:with-param name="base" select="$base" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="starts-with($base, '/lod/transport/')">
			<xsl:call-template name="transportLinks">
				<xsl:with-param name="base" select="$base" />
			</xsl:call-template>
		</xsl:when>
	</xsl:choose>
</xsl:template>
	
<xsl:template name="osLinks">
	<xsl:param name="base" />
	<xsl:choose>
		<xsl:when test="starts-with($base, '/lod/os/postcode-sector/')">
			<xsl:variable name="sector">
				<xsl:call-template name="subPath">
					<xsl:with-param name="uri" select="$base" />
					<xsl:with-param name="component" select="'postcode-sector'" />
				</xsl:call-template>
			</xsl:variable> 
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($sector, '/driving-test-centre')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Driving test centres in sector</xsl:with-param>
				</xsl:call-template>
				<xsl:if test="contains($base, '/driving-test-centre')">
					<xsl:call-template name="moreinfoLink">
						<xsl:with-param name="uri" select="'/lod/transport/doc/driving-test-centre'" />
						<xsl:with-param name="current" select="$base" />
						<xsl:with-param name="label">All driving test centres</xsl:with-param>
					</xsl:call-template>
				</xsl:if>
			</ul>
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($sector, '/unit')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Postcodes in sector</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with($base, '/lod/os/postcode-district/')">
			<xsl:variable name="district">
				<xsl:call-template name="subPath">
					<xsl:with-param name="uri" select="$base" />
					<xsl:with-param name="component" select="'postcode-district'" />
				</xsl:call-template>
			</xsl:variable> 
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($district, '/driving-test-centre')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Driving test centres in district</xsl:with-param>
				</xsl:call-template>
				<xsl:if test="contains($base, '/driving-test-centre')">
					<xsl:call-template name="moreinfoLink">
						<xsl:with-param name="uri" select="'/lod/transport/doc/driving-test-centre'" />
						<xsl:with-param name="current" select="$base" />
						<xsl:with-param name="label">All driving test centres</xsl:with-param>
					</xsl:call-template>
				</xsl:if>
			</ul>
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($district, '/unit')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Postcodes in district</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($district, '/sector')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Postcode sectors in district</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with($base, '/lod/os/postcode-area/')">
			<xsl:variable name="area">
				<xsl:call-template name="subPath">
					<xsl:with-param name="uri" select="$base" />
					<xsl:with-param name="component" select="'postcode-area'" />
				</xsl:call-template>
			</xsl:variable> 
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($area, '/driving-test-centre')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Driving test centres in area</xsl:with-param>
				</xsl:call-template>
				<xsl:if test="contains($base, '/driving-test-centre')">
					<xsl:call-template name="moreinfoLink">
						<xsl:with-param name="uri" select="'/lod/transport/doc/driving-test-centre'" />
						<xsl:with-param name="current" select="$base" />
						<xsl:with-param name="label">All driving test centres</xsl:with-param>
					</xsl:call-template>
				</xsl:if>
			</ul>
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($area, '/unit')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Postcodes in area</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($area, '/sector')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Postcode sectors in area</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($area, '/district')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Postcode districts in area</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with($base, '/lod/os/postcode/')">
			<xsl:variable name="postcode">
				<xsl:call-template name="subPath">
					<xsl:with-param name="uri" select="$base" />
					<xsl:with-param name="component" select="'postcode'" />
				</xsl:call-template>
			</xsl:variable>
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($postcode, '/driving-test-centre')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Driving test centres near postcode</xsl:with-param>
				</xsl:call-template>
				<xsl:if test="contains($base, '/driving-test-centre')">
					<xsl:call-template name="moreinfoLink">
						<xsl:with-param name="uri" select="'/lod/transport/doc/driving-test-centre'" />
						<xsl:with-param name="current" select="$base" />
						<xsl:with-param name="label">All driving test centres</xsl:with-param>
					</xsl:call-template>
				</xsl:if>
			</ul>
		</xsl:when>
	</xsl:choose>
	<xsl:choose>
		<xsl:when test="starts-with($base, '/lod/os/postcode')">
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/lod/os/postcode'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">All postcodes</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/lod/os/postcode-sector'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">All postcode sectors</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/lod/os/postcode-district'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">All postcode districts</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/lod/os/postcode-area'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">All postcode areas</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with($base, '/lod/os/def/') and (type/item/@href = 'http://www.w3.org/2000/01/rdf-schema#Class' or type/item/@href = 'http://www.w3.org/2002/07/owl#Class')">
			<ul>
				<li><a href="{$base}/property">Properties</a></li>
				<li><a href="{$base}/instance">Instances</a></li>
				<li><a href="{$base}/subclass">Subclasses</a></li>
			</ul>
		</xsl:when>
	</xsl:choose>
</xsl:template>

<xsl:template name="transportLinks">
	<xsl:param name="base" />
	<xsl:if test="starts-with($base, '/lod/transport/doc/driving-test-centre/')">
		<xsl:variable name="centre">
			<xsl:call-template name="subPath">
				<xsl:with-param name="uri" select="$base" />
				<xsl:with-param name="component" select="'driving-test-centre'" />
			</xsl:call-template>
		</xsl:variable> 
		<ul>
			<xsl:call-template name="moreinfoLink">
				<xsl:with-param name="uri" select="concat($centre, '/availability')" />
				<xsl:with-param name="current" select="$base" />
				<xsl:with-param name="label">Test availability</xsl:with-param>
			</xsl:call-template>
			<xsl:call-template name="moreinfoLink">
				<xsl:with-param name="uri" select="$centre" />
				<xsl:with-param name="current" select="$base" />
				<xsl:with-param name="label">Test centre</xsl:with-param>
			</xsl:call-template>
		</ul>
	</xsl:if>
	<xsl:choose>
		<xsl:when test="starts-with($base, '/lod/transport/doc/driving-test-centre') or starts-with($base, '/lod/transport/doc/theory-test-centre') or starts-with($base, '/lod/transport/doc/practical-test-centre')">
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/lod/transport/doc/practical-test-centre/car'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Offering car driving tests</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/lod/transport/doc/practical-test-centre/taxi'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Offering taxi driving tests</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/lod/transport/doc/practical-test-centre/vocational'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Offering vocational driving tests</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/lod/transport/doc/practical-test-centre/motorcycle-module-1'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Offering motorcycle module 1 tests</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/lod/transport/doc/practical-test-centre/motorcycle-module-2'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Offering motorcycle module 2 tests</xsl:with-param>
				</xsl:call-template>
			</ul>
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/lod/transport/doc/practical-test-centre'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Practical test centres</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/lod/transport/doc/theory-test-centre'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Theory test centres</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/lod/transport/doc/driving-test-centre'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">All driving test centres</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with($base, '/lod/transport/def/') and (type/item/@href = 'http://www.w3.org/2000/01/rdf-schema#Class' or type/item/@href = 'http://www.w3.org/2002/07/owl#Class')">
			<ul>
				<li><a href="{$base}/property">Properties</a></li>
				<li><a href="{$base}/instance">Instances</a></li>
				<li><a href="{$base}/subclass">Subclasses</a></li>
			</ul>
		</xsl:when>
	</xsl:choose>
</xsl:template>

</xsl:stylesheet>