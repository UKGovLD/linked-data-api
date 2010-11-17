<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:import href="result.xsl" />

<xsl:template match="@href" mode="uri">
	<xsl:choose>
		<xsl:when test="starts-with(., 'http://reference.data.gov.uk/def/mp/')">
			<xsl:value-of select="concat('/doc/', substring-after(., 'def/'))" />
		</xsl:when>
		<xsl:when test="starts-with(., 'http://reference.data.gov.uk/id/day') or
			starts-with(., 'http://reference.data.gov.uk/id/year') or
			starts-with(., 'http://reference.data.gov.uk/id/gregorian-instant')">
			<xsl:value-of select="." />
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="." />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="isPartOf" mode="moreinfo">
	<xsl:variable name="base" select="substring-after(@href, 'http://reference.data.gov.uk')" />
	<xsl:variable name="path" select="substring-before(concat($base, '?'), '?')" />
	<xsl:call-template name="orgLinks">
		<xsl:with-param name="base" select="$path" />
	</xsl:call-template>
</xsl:template>

<xsl:template match="primaryTopic" mode="moreinfo">
	<xsl:call-template name="orgLinks">
		<xsl:with-param name="base">
			<xsl:choose>
				<xsl:when test="starts-with(@href, 'http://reference.data.gov.uk/id/')">
					<xsl:value-of select="concat('/doc/', substring-after(@href, '/id/'))"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="substring-after(@href, 'http://reference.data.gov.uk')"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:with-param>
	</xsl:call-template>
</xsl:template>

<xsl:template name="orgLinks">
	<xsl:param name="base" />
	<xsl:choose>
		<xsl:when test="starts-with($base, '/doc/department/')">
			<xsl:variable name="department">
				<xsl:call-template name="subPath">
					<xsl:with-param name="uri" select="$base" />
					<xsl:with-param name="component" select="'department'" />
				</xsl:call-template>
			</xsl:variable> 
			<xsl:choose>
				<xsl:when test="contains($base, '/unit/')">
					<xsl:variable name="unit">
						<xsl:call-template name="subPath">
							<xsl:with-param name="uri" select="$base" />
							<xsl:with-param name="component" select="'unit'" />
						</xsl:call-template>
					</xsl:variable> 
					<ul>
						<xsl:call-template name="moreinfoLink">
							<xsl:with-param name="uri" select="concat($unit, '/statistics')" />
							<xsl:with-param name="current" select="$base" />
							<xsl:with-param name="label">Unit post statistics</xsl:with-param>
						</xsl:call-template>
						<xsl:call-template name="moreinfoLink">
							<xsl:with-param name="uri" select="concat($unit, '/post')" />
							<xsl:with-param name="current" select="$base" />
							<xsl:with-param name="label">Unit posts</xsl:with-param>
						</xsl:call-template>
						<xsl:call-template name="moreinfoLink">
							<xsl:with-param name="uri" select="$unit" />
							<xsl:with-param name="current" select="$base" />
							<xsl:with-param name="label">Unit</xsl:with-param>
						</xsl:call-template>
					</ul>
				</xsl:when>
				<xsl:when test="contains($base, '/post/')">
					<xsl:variable name="post">
						<xsl:call-template name="subPath">
							<xsl:with-param name="uri" select="$base" />
							<xsl:with-param name="component" select="'post'" />
						</xsl:call-template>
					</xsl:variable> 
					<ul>
						<xsl:call-template name="moreinfoLink">
							<xsl:with-param name="uri" select="concat($post, '/statistics')" />
							<xsl:with-param name="current" select="$base" />
							<xsl:with-param name="label">Post statistics</xsl:with-param>
						</xsl:call-template>
						<xsl:call-template name="moreinfoLink">
							<xsl:with-param name="uri" select="concat($post, '/immediate-reports')" />
							<xsl:with-param name="current" select="$base" />
							<xsl:with-param name="label">Post immediate reports</xsl:with-param>
						</xsl:call-template>
						<xsl:call-template name="moreinfoLink">
							<xsl:with-param name="uri" select="concat($post, '/reports')" />
							<xsl:with-param name="current" select="$base" />
							<xsl:with-param name="label">Post reports</xsl:with-param>
						</xsl:call-template>
						<xsl:call-template name="moreinfoLink">
							<xsl:with-param name="uri" select="$post" />
							<xsl:with-param name="current" select="$base" />
							<xsl:with-param name="label">Post</xsl:with-param>
						</xsl:call-template>
					</ul>
				</xsl:when>
			</xsl:choose>
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($department, '/minister')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Department ministers</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($department, '/post')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Department <abbr title="Senior Civil Service">SCS</abbr> posts</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($department, '/unit')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Department units</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="$department" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Department</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with($base, '/doc/public-body/')">
			<xsl:variable name="publicBody">
				<xsl:call-template name="subPath">
					<xsl:with-param name="uri" select="$base" />
					<xsl:with-param name="component" select="'public-body'" />
				</xsl:call-template>
			</xsl:variable> 
			<xsl:choose>
				<xsl:when test="contains($base, '/unit/')">
					<xsl:variable name="unit">
						<xsl:call-template name="subPath">
							<xsl:with-param name="uri" select="$base" />
							<xsl:with-param name="component" select="'unit'" />
						</xsl:call-template>
					</xsl:variable> 
					<ul>
						<xsl:call-template name="moreinfoLink">
							<xsl:with-param name="uri" select="concat($unit, '/statistics')" />
							<xsl:with-param name="current" select="$base" />
							<xsl:with-param name="label">Unit post statistics</xsl:with-param>
						</xsl:call-template>
						<xsl:call-template name="moreinfoLink">
							<xsl:with-param name="uri" select="concat($unit, '/post')" />
							<xsl:with-param name="current" select="$base" />
							<xsl:with-param name="label">Unit posts</xsl:with-param>
						</xsl:call-template>
						<xsl:call-template name="moreinfoLink">
							<xsl:with-param name="uri" select="$unit" />
							<xsl:with-param name="current" select="$base" />
							<xsl:with-param name="label">Unit</xsl:with-param>
						</xsl:call-template>
					</ul>
				</xsl:when>
				<xsl:when test="contains($base, '/post/')">
					<xsl:variable name="post">
						<xsl:call-template name="subPath">
							<xsl:with-param name="uri" select="$base" />
							<xsl:with-param name="component" select="'post'" />
						</xsl:call-template>
					</xsl:variable> 
					<ul>
						<xsl:call-template name="moreinfoLink">
							<xsl:with-param name="uri" select="concat($post, '/statistics')" />
							<xsl:with-param name="current" select="$base" />
							<xsl:with-param name="label">Post statistics</xsl:with-param>
						</xsl:call-template>
						<xsl:call-template name="moreinfoLink">
							<xsl:with-param name="uri" select="concat($post, '/immediate-reports')" />
							<xsl:with-param name="current" select="$base" />
							<xsl:with-param name="label">Post immediate reports</xsl:with-param>
						</xsl:call-template>
						<xsl:call-template name="moreinfoLink">
							<xsl:with-param name="uri" select="concat($post, '/reports')" />
							<xsl:with-param name="current" select="$base" />
							<xsl:with-param name="label">Post reports</xsl:with-param>
						</xsl:call-template>
						<xsl:call-template name="moreinfoLink">
							<xsl:with-param name="uri" select="$post" />
							<xsl:with-param name="current" select="$base" />
							<xsl:with-param name="label">Post</xsl:with-param>
						</xsl:call-template>
					</ul>
				</xsl:when>
			</xsl:choose>
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($publicBody, '/post')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Public body <abbr title="Senior Civil Service">SCS</abbr> posts</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($publicBody, '/unit')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Public body units</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="$publicBody" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Public body</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
	</xsl:choose>
	<xsl:choose>
		<xsl:when test="starts-with($base, '/doc/')">
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/ministerial-department'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Ministerial departments</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/non-ministerial-department'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Non-ministerial departments</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/department'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">All departments</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/public-body'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">All public bodies</xsl:with-param>
				</xsl:call-template>
			</ul>
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/minister'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">All ministers</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/seat'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">All seats</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/mp'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">All MPs</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/peer'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">All peers</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with($base, '/def/') and (type/item/@href = 'http://www.w3.org/2000/01/rdf-schema#Class' or type/item/@href = 'http://www.w3.org/2002/07/owl#Class')">
			<ul>
				<li><a href="{$base}/property">Properties</a></li>
				<li><a href="{$base}/instance">Instances</a></li>
				<li><a href="{$base}/subclass">Subclasses</a></li>
			</ul>
		</xsl:when>
	</xsl:choose>
</xsl:template>

</xsl:stylesheet>