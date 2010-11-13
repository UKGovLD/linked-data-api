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
		<!--
		<xsl:when test="starts-with(., 'http://reference.data.gov.uk/id/')">
			<xsl:value-of select="concat('/doc/', substring-after(., 'id/'))" />
		</xsl:when>
		-->
		<xsl:otherwise>
			<xsl:value-of select="." />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="primaryTopic" mode="moreinfo">
	<xsl:if test="starts-with(@href, 'http://reference.data.gov.uk/id/department/')">
		<xsl:variable name="base" select="concat('/doc/', substring-after(@href, '/id/'))" />
		<ul>
			<xsl:choose>
				<xsl:when test="contains($base, '/statistics')">
					<xsl:choose>
						<xsl:when test="contains($base, '/unit/')">
							<li><a href="{substring-before($base, '/statistics')}">Unit</a></li>
							<li><a href="{substring-before($base, '/unit')}">Organisation</a></li>
						</xsl:when>
						<xsl:otherwise>
							<li><a href="{substring-before($base, '/statistics')}">Post</a></li>
							<li><a href="{substring-before($base, '/post')}">Organisation</a></li>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:when>
				<xsl:when test="contains($base, '/unit/')">
					<li><a href="{$base}/statistics">Statistics about Posts in <xsl:apply-templates select="." mode="name" /></a></li>
					<li><a href="{$base}/post">Posts in <xsl:apply-templates select="." mode="name" /></a></li>
					<li><a href="{substring-before($base, '/unit')}/unit">Other Units</a></li>
					<li><a href="{substring-before($base, '/unit')}">Organisation</a></li>
				</xsl:when>
				<xsl:when test="contains($base, '/post/')">
					<li><a href="{$base}/statistics">Statistics</a></li>
					<li><a href="{$base}/immediate-reports">Immediate Reports</a></li>
					<li><a href="{$base}/reports">All Reports</a></li>
					<li><a href="{substring-before($base, '/post')}/post">Other Posts</a></li>
					<li><a href="{substring-before($base, '/post')}">Organisation</a></li>
				</xsl:when>
				<xsl:otherwise>
					<li><a href="{$base}/minister">Ministers in <xsl:apply-templates select="." mode="name" /></a></li>
					<li><a href="{$base}/unit">Units in <xsl:apply-templates select="." mode="name" /></a></li>
					<li><a href="{$base}/post"><abbr title="Senior Civil Service">SCS</abbr> Posts in <xsl:apply-templates select="." mode="name" /></a></li>
					<li><a href="/doc/ministerial-department">Ministerial Departments</a></li>
					<li><a href="/doc/non-ministerial-department">Non-Ministerial Departments</a></li>
					<li><a href="/doc/department">Other Departments</a></li>
				</xsl:otherwise>
			</xsl:choose>
		</ul>
	</xsl:if>
</xsl:template>

</xsl:stylesheet>