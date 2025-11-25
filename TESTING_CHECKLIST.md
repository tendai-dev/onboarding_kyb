# Consolidation Testing Checklist

Use this checklist to verify the consolidation is working correctly.

## Prerequisites

- [ ] Docker and Docker Compose installed
- [ ] All dependencies running (PostgreSQL, Redis, Kafka, MinIO)
- [ ] Frontend applications can be started

## 1. Service Startup

### Start Unified Services
```bash
docker-compose up -d onboarding-api onboarding-workers
```

- [ ] `onboarding-api` container starts successfully
- [ ] `onboarding-workers` container starts successfully
- [ ] No startup errors in logs
- [ ] Health endpoints respond

### Verify Health
```bash
# API Health
curl http://localhost:8001/health

# Gateway Health
curl http://localhost:8000/health
```

- [ ] API health endpoint returns 200
- [ ] Gateway health endpoint returns 200

## 2. Database Verification

### Check Schemas Created
```sql
-- Connect to PostgreSQL
\dn

-- Should see schemas:
-- audit, checklist, notification, messaging, 
-- entity_configuration, work_queue, risk, 
-- projections, document
```

- [ ] All schemas exist
- [ ] Tables created in each schema
- [ ] No migration errors

## 3. API Endpoint Testing

### Through Gateway (Port 8000)
Test each endpoint through the gateway:

#### Audit Logs
- [ ] `GET http://localhost:8000/api/audit/` - List audit logs
- [ ] `POST http://localhost:8000/api/audit/` - Create audit log

#### Checklists
- [ ] `GET http://localhost:8000/api/checklists/` - List checklists
- [ ] `POST http://localhost:8000/api/checklists/` - Create checklist

#### Notifications
- [ ] `GET http://localhost:8000/api/notifications/` - List notifications
- [ ] `POST http://localhost:8000/api/notifications/` - Send notification

#### Messages
- [ ] `GET http://localhost:8000/api/messages/` - List messages
- [ ] `POST http://localhost:8000/api/messages/` - Send message

#### Webhooks
- [ ] `POST http://localhost:8000/api/webhooks/` - Deliver webhook

#### Entity Configuration
- [ ] `GET http://localhost:8000/api/entities/` - List entity types
- [ ] `POST http://localhost:8000/api/entities/` - Create entity type

#### Work Queue
- [ ] `GET http://localhost:8000/api/workqueue` - List work items
- [ ] `POST http://localhost:8000/api/workqueue` - Create work item

#### Risk Assessments
- [ ] `GET http://localhost:8000/api/risk/risk-assessments` - List assessments
- [ ] `POST http://localhost:8000/api/risk/risk-assessments` - Create assessment

#### Projections
- [ ] `GET http://localhost:8000/api/v1/dashboard` - Get dashboard
- [ ] `GET http://localhost:8000/api/v1/statistics` - Get statistics
- [ ] `GET http://localhost:8000/api/v1/trends` - Get trends
- [ ] `GET http://localhost:8000/api/v1/cases` - Get cases

#### Documents
- [ ] `GET http://localhost:8000/api/documents` - List documents
- [ ] `POST http://localhost:8000/api/documents/upload` - Upload document
- [ ] `GET http://localhost:8000/api/documents/direct?key={key}` - Download document

### Direct API Access (Port 8001)
Test endpoints directly on the unified API:

- [ ] `GET http://localhost:8001/api/v1/audit-logs`
- [ ] `GET http://localhost:8001/api/v1/checklists`
- [ ] `GET http://localhost:8001/api/v1/notifications`
- [ ] `GET http://localhost:8001/api/v1/messages`
- [ ] `GET http://localhost:8001/api/v1/webhooks`
- [ ] `GET http://localhost:8001/api/v1/entity-types`
- [ ] `GET http://localhost:8001/api/v1/workqueue`
- [ ] `GET http://localhost:8001/api/v1/risk-assessments`
- [ ] `GET http://localhost:8001/api/v1/projections/dashboard`
- [ ] `GET http://localhost:8001/api/v1/documents`

## 4. Frontend Integration

### Admin Portal
- [ ] Start admin portal: `cd admin && npm run dev`
- [ ] Login works
- [ ] Dashboard loads data
- [ ] All pages load correctly
- [ ] Forms submit successfully
- [ ] File uploads work

### Partner Portal
- [ ] Start partner portal: `cd partner && npm run dev`
- [ ] Login works
- [ ] Dashboard loads data
- [ ] All pages load correctly
- [ ] Forms submit successfully
- [ ] File uploads work

## 5. Worker Services

### Outbox Relay Worker
- [ ] Worker starts successfully
- [ ] Events are published to Kafka
- [ ] No duplicate events
- [ ] Failed events are retried

### Compliance Refresh Worker
- [ ] Worker starts successfully
- [ ] Distributed lock works
- [ ] Refresh job runs on schedule
- [ ] No concurrent executions

## 6. Integration Points

### Kafka Events
- [ ] Events are published correctly
- [ ] Event consumers receive events
- [ ] No event loss

### Database Connections
- [ ] All DbContexts connect successfully
- [ ] No connection pool exhaustion
- [ ] Transactions work correctly

### Redis
- [ ] Cache operations work
- [ ] Distributed locks work
- [ ] Session storage works

### MinIO (Documents)
- [ ] File uploads work
- [ ] File downloads work
- [ ] Presigned URLs generate correctly

## 7. Performance Testing

### Load Testing
- [ ] API handles concurrent requests
- [ ] Response times are acceptable (<500ms for most endpoints)
- [ ] No memory leaks
- [ ] Database connections are pooled correctly

### Stress Testing
- [ ] API handles high load
- [ ] Graceful degradation under load
- [ ] Error handling works correctly

## 8. Error Handling

- [ ] 404 errors return correctly
- [ ] 400 validation errors return correctly
- [ ] 500 errors are logged
- [ ] Error messages are helpful

## 9. Authentication & Authorization

- [ ] JWT authentication works
- [ ] Role-based authorization works
- [ ] Unauthorized requests are rejected
- [ ] Token refresh works

## 10. Monitoring & Logging

- [ ] Logs are being generated
- [ ] Logs are searchable
- [ ] Error logs are captured
- [ ] Performance metrics are tracked

## Common Issues & Solutions

### Issue: Service won't start
**Solution**: Check logs: `docker-compose logs onboarding-api`

### Issue: Database connection errors
**Solution**: Verify PostgreSQL is running and connection string is correct

### Issue: Gateway returns 502
**Solution**: Verify `onboarding-api` is running and accessible

### Issue: Frontend can't connect
**Solution**: Check proxy route configuration and API URL

### Issue: Worker not processing
**Solution**: Check worker logs and verify Kafka is accessible

## Success Criteria

✅ All endpoints respond correctly  
✅ Frontend applications work  
✅ Worker services process jobs  
✅ No errors in logs  
✅ Performance is acceptable  
✅ All integrations work  

---

**Testing Date**: _______________  
**Tested By**: _______________  
**Status**: ⬜ Pass ⬜ Fail ⬜ Partial

